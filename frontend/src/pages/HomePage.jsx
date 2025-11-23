import React, { useState, useEffect } from 'react';
import { userAPI, districtAPI, farmAPI, productivityAPI, warehouseAPI } from '../services/api';
import Card from '../components/Card';

export default function HomePage() {
  const [stats, setStats] = useState({
    users: 0,
    districts: 0,
    farms: 0,
    productivities: 0,
    warehouses: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, districtsRes, farmsRes, productivitiesRes, warehousesRes] = await Promise.all([
          userAPI.getAll(),
          districtAPI.getAll(),
          farmAPI.getAll(),
          productivityAPI.getAll(),
          warehouseAPI.getAll(),
        ]);

        setStats({
          users: usersRes.data?.length || 0,
          districts: districtsRes.data?.length || 0,
          farms: farmsRes.data?.length || 0,
          productivities: productivitiesRes.data?.length || 0,
          warehouses: warehousesRes.data?.length || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { label: 'Users', value: stats.users, bg: 'bg-blue-500' },
    { label: 'Districts', value: stats.districts, bg: 'bg-green-500' },
    { label: 'Farms', value: stats.farms, bg: 'bg-yellow-500' },
    { label: 'Productivities', value: stats.productivities, bg: 'bg-purple-500' },
    { label: 'Warehouses', value: stats.warehouses, bg: 'bg-red-500' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-4xl font-bold mb-8">Dashboard</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {statCards.map((card, idx) => (
            <Card key={idx} className={`${card.bg} text-white`}>
              <div className="text-4xl font-bold mb-2">{card.value}</div>
              <div className="text-lg">{card.label}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
