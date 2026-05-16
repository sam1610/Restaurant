// Corrected import: 'type ClientSchema' is the modern equivalent of 'type Client'.
import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // Best practice: Model names are typically singular.
  CloudKitchenOperation: a.model({
    // --- Primary Key Attributes ---
    // These are defined as standard fields first.
    pk: a.string().required(),
    sk: a.string().required(),

    // --- Index Attributes ---
    // These fields are defined as optional because they will only exist on specific
    // item types within your single table (e.g., an Order item won't have an agentId).
    statusDate: a.string(),
    agentId: a.string(),
    // Corrected: The function is a.dateTime() (camelCase).
    orderDate: a.dateTime(),
    gsi2pk: a.string(),
    gsi2sk: a.float(),

    // --- Data Attributes ---
    // These are also optional as they apply to different entity types.
    customerName: a.string(),
    // Corrected: The function is a.integer()
    totalOrders: a.integer(),
    totalSpent: a.float(),
    // a.json() is perfect for storing complex, nested objects like an address.
    defaultDeliveryAddress: a.json(),
    orderId: a.string(),
    customerPhone: a.string(),
    status: a.string(),
    totalAmount: a.float(),
    itemsNumber: a.integer(),
    itemId: a.string(),
    itemName: a.string(),
    quantity: a.integer(),
    unitPrice: a.float(),
    discount: a.float(),
    itemTotal: a.float(),
  })
  // Corrected: The modern way to define a custom table name and primary key.
  // This is much cleaner than the old .table() directive.
  .identifier(['pk', 'sk'])
  .tableName('CloudKitchenTable')

  // Corrected: The .secondaryIndexes() method uses a chained-method syntax.
  .secondaryIndexes((index) => [
    // LSI Definition: An LSI must share the partition key of the base table ('pk').
    // This allows you to query items within a partition, sorted by 'statusDate'.
    index('pk').sortKeys(['statusDate']).name('byStatus'),

    // GSI Definition: A GSI defines a new partition key and optional sort key.
    // This allows querying across the entire table by agent, sorted by order date.
    index('agentId').sortKeys(['orderDate']).name('byAgent'),

    // GSI Definition for customer spending.
    index('gsi2pk').sortKeys(['gsi2sk']).name('byCustomerSpending'),
  ])
  .authorization((allow) => [allow.group('KitchenAdmins')]),
});

// Corrected: Use ClientSchema for the exported type.
export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    // This correctly sets Amazon Cognito User Pools as the default auth method.
    defaultAuthorizationMode: 'userPool',
  },
});