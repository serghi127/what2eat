"use client"; // needed for useState/useEffect

import React, { useEffect, useState } from "react";

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users") // Make sure this API route exists
      .then((res) => res.json())
      .then((data: User[]) => setUsers(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-gray-500 p-4">Loading users...</p>;
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Users</h1>
      <ul className="space-y-2">
        {users.map((user) => (
          <li
            key={user.id}
            className="border rounded-md p-3 hover:shadow-md transition-shadow"
          >
            <p className="font-semibold">{user.name}</p>
            <p className="text-gray-600">{user.email}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UsersPage;
