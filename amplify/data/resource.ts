import { a, defineData } from '@aws-amplify/backend'; // Removed 'type Client'—it's not needed here

const schema = a.schema({
  KitchenOperations: a.model({
    // --- Primary Key ---
    pk: a.string().required(), // BusinessPhone
    sk: a.string().required(), // e.g., 'CUSTOMER#...', 'ORDER#...'

    // --- Index Attributes ---
    // For LSI: byStatus
    statusDate: a.string(),
    // For GSI: byAgent
    agentId: a.string(),
    OrderDate: a.datetime(),
    // For GSI: byCustomerSpending
    gsi2pk: a.string(),
    gsi2sk: a.float(),

    // --- Data Attributes ---
    // Customer fields
    CustomerName: a.string(),
    TotalOrders: a.integer(), // Fixed: Use a.integer() not a.int()
    TotalSpent: a.float(),
    DefaultDeliveryAddress: a.json(),
    // Order (Header) fields
    OrderID: a.string(),
    CustomerPhone: a.string(),
    Status: a.string(),
    TotalAmount: a.float(),
    ItemsNumber: a.integer(), // Fixed: Use a.integer()
    // Order Item fields
    ItemID: a.string(),
    ItemName: a.string(),
    Quantity: a.integer(), // Fixed: Use a.integer()
    UnitPrice: a.float(),
    Discount: a.float(),
    ItemTotal: a.float(),
  })
  .authorization((allow: any) => [allow.group('KitchenAdmins')]) // Remove if not using auth
  .primaryKey({ partitionKey: 'pk', sortKey: 'sk' })
  .secondaryIndexes((index: any) => [
    // LSI: Get orders by status for a specific business.
    index.local({
      name: 'byStatus',
      sortKey: 'statusDate'
    }),
    
    // GSI 1: Get all orders delivered by a specific agent.
    index.global({
      name: 'byAgent',
      partitionKey: 'agentId',
      sortKey: 'OrderDate'
    }),

    // GSI 2: Get customers for a business, sorted by total spending.
    index.global({
      name: 'byCustomerSpending',
      partitionKey: 'gsi2pk',
      sortKey: 'gsi2sk'
    })
  ])
});

// Fixed: Infer Client type from defineData (no explicit import needed)
export type Schema = ReturnType<typeof defineData>['schema']; // Or use 'any' if issues persist
export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool', // Or 'apiKey' if not using auth
  },
});