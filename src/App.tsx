import React from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import Dashboard from './components/Dashboard';
import AIChat from './components/AIChat';
import Header from './components/Header';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-[#181926] text-gray-100">
      {/* Decorative accent bar */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-blue-300 to-blue-200 z-10" />
      <Header />
      <main className="flex-grow p-4 flex justify-center items-start">
        <div className="w-full max-w-6xl">
          <Tabs className="h-full flex flex-col">
            <TabList className="flex border-b border-[#23243a] mb-4 bg-[#23243a] rounded-t-xl shadow-sm">
              <Tab className="px-4 py-2 mr-2 focus:outline-none cursor-pointer rounded-t-lg bg-[#23243a] hover:bg-[#23243a]/80 text-gray-100 transition-colors">
                Dashboard
              </Tab>
              <Tab className="px-4 py-2 focus:outline-none cursor-pointer rounded-t-lg bg-[#23243a] hover:bg-[#23243a]/80 text-gray-100 transition-colors">
                AI Chatbot
              </Tab>
            </TabList>

            <TabPanel className="flex-grow">
              <Dashboard />
            </TabPanel>
            
            <TabPanel className="flex-grow">
              <AIChat />
            </TabPanel>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default App;