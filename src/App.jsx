import React, { useState, useMemo, useEffect } from 'react';
import * as Recharts from 'recharts';
import { generateClient } from 'aws-amplify/data';
import { Authenticator } from '@aws-amplify/ui-react'; // Not needed here if using main.tsx wrapper
import type { Schema } from '../amplify/data/resource'; // Adjust path

const client = generateClient<Schema>();

// --- Static Data ---
const staticData = {
  businessName: "The Cloud Kitchen",
  deliveryAgents: [
    { id: "AGENT_001", name: "John Deliver" },
    { id: "AGENT_002", name: "Maria Speed" },
    { id: "AGENT_003", name: "Sam Courier" },
  ],
};

// --- Helper Functions & Static Components ---
const classNames = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');
const statusColors = { ordered: 'bg-blue-500', 'in preparation': 'bg-yellow-500', prepared: 'bg-green-500', delivered: 'bg-gray-500', cancelled: 'bg-red-500' };

// --- Icon Components (Fixed prop typing) ---
const HomeIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);
const ClipboardListIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="M12 11h4"></path><path d="M12 16h4"></path><path d="M8 11h.01"></path><path d="M8 16h.01"></path>
  </svg>
);
const UsersIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

// --- Main App Component (Fixed prop typing) ---
interface AppProps {
  signOut: () => void;
  user: any; // Or import { User } from 'aws-amplify/auth' for stricter typing
}

export default function App({ signOut, user }: AppProps) {
  const [activeView, setActiveView] = useState('dashboard');
  const [modal, setModal] = useState(null);
  const [appData, setAppData] = useState({
    businessName: staticData.businessName,
    deliveryAgents: staticData.deliveryAgents,
    items: []
  });
  const [loading, setLoading] = useState(true);

  // Filter data for a specific business (hardcoded; could derive from user attributes).
  const businessPhone = "+15551112222";
  
  // Fetch data from the database on mount (authenticated via userPool).
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await client.models.KitchenOperations.list({
          filter: { pk: { eq: businessPhone } }
        });
        setAppData(prev => ({ ...prev, items: result.data ?? [] }));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) { // Only fetch if authenticated
      fetchData();
    }
  }, [user, businessPhone]);

  const businessData = useMemo(() => appData.items.filter(item => item.pk === businessPhone), [appData.items, businessPhone]);
  
  const orders = useMemo(() => businessData.filter(item => item.sk.startsWith('ORDER#') && !item.sk.includes('#ITEM#')), [businessData]);
  const customers = useMemo(() => businessData.filter(item => item.sk.startsWith('CUSTOMER#')), [businessData]);

  const handleAssignDelivery = async (agentId: string, selectedOrders: string[]) => {
    try {
      for (const orderId of selectedOrders) {
        // Find the order record by sk (ORDER#<orderId>)
        const orderRecord = businessData.find(item => item.OrderID === orderId);
        if (orderRecord) {
          await client.models.KitchenOperations.update({
            pk: orderRecord.pk,
            sk: orderRecord.sk,
            agentId: agentId // Update the agentId field
          });
        }
      }
      console.log(`Assigned ${selectedOrders.length} orders to ${agentId}`);
      // Optionally refetch data here
      window.location.reload(); // Simple refresh; use state update in production
    } catch (error) {
      console.error('Error assigning delivery:', error);
    }
    setModal(null);
  };

  const renderView = () => {
    if (loading || !user) {
      return (
        <div className="p-4 flex items-center justify-center">
          <p className="text-slate-400">{loading ? 'Loading...' : 'Please sign in to access the app.'}</p>
        </div>
      );
    }

    switch (activeView) {
      case 'dashboard':
        return <DashboardView orders={orders} setModal={setModal} businessName={appData.businessName} />;
      case 'orders':
        return <OrdersView allItems={businessData} setModal={setModal} />;
      case 'customers':
        return <CustomersView customers={customers} setModal={setModal} />;
      default:
        return <DashboardView orders={orders} setModal={setModal} businessName={appData.businessName} />;
    }
  };

  const renderModal = () => {
    if (!modal) return null;
    if (modal.type === 'orderDetail') {
      return <OrderDetailModal order={modal.data.order} allItems={businessData} onClose={() => setModal(null)} />;
    }
    if (modal.type === 'assignDelivery') {
      return <AssignDeliveryModal orders={orders} deliveryAgents={appData.deliveryAgents} onAssign={handleAssignDelivery} onClose={() => setModal(null)} />;
    }
    return null;
  };

  return (
    <div className="bg-slate-900 text-slate-200 min-h-screen font-sans pb-20">
      {renderModal()}
      <header className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
        <h1 className="text-xl font-bold text-white">Welcome, {user?.username || 'User'}</h1>
        <button onClick={signOut} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
          Sign Out
        </button>
      </header>
      <main>
        {renderView()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 flex justify-around">
        <button onClick={() => setActiveView('dashboard')} className={classNames('flex-1 flex flex-col items-center justify-center py-2', activeView === 'dashboard' ? 'text-sky-400' : 'text-slate-400')}>
          <HomeIcon className="h-6 w-6 mb-1" />
          <span className="text-xs">Dashboard</span>
        </button>
        <button onClick={() => setActiveView('orders')} className={classNames('flex-1 flex flex-col items-center justify-center py-2', activeView === 'orders' ? 'text-sky-400' : 'text-slate-400')}>
          <ClipboardListIcon className="h-6 w-6 mb-1" />
          <span className="text-xs">Orders</span>
        </button>
        <button onClick={() => setActiveView('customers')} className={classNames('flex-1 flex flex-col items-center justify-center py-2', activeView === 'customers' ? 'text-sky-400' : 'text-slate-400')}>
          <UsersIcon className="h-6 w-6 mb-1" />
          <span className="text-xs">Customers</span>
        </button>
      </nav>
    </div>
  );
}

// --- View Components --- (Unchanged from previous; include them here if needed)
const DashboardView = ({ orders, setModal, businessName }: { orders: any[], setModal: any, businessName: string }) => {
  // ... (full implementation as before)
};

const OrdersView = ({ allItems, setModal }: { allItems: any[], setModal: any }) => {
  // ... (full implementation as before)
};

const CustomersView = ({ customers, setModal }: { customers: any[], setModal: any }) => {
  // ... (full implementation as before)
};

// --- Modal Components --- (Unchanged; include as before)
const OrderDetailModal = ({ order, allItems, onClose }: { order: any, allItems: any[], onClose: () => void }) => {
  // ... (full implementation as before)
};

const AssignDeliveryModal = ({ orders, deliveryAgents, onAssign, onClose }: { orders: any[], deliveryAgents: any[], onAssign: (agentId: string, selectedOrders: string[]) => void, onClose: () => void }) => {
  // ... (full implementation as before)
};