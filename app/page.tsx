"use client"; 

import React, { useEffect, useState } from 'react';

type User = {
  id: number;
  name: string;
  email: string;
};

const Home: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then((data: User[]) => setUsers(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Users in when2eat</h1>
      <ul>
        {users.map(u => (
          <li key={u.id}>
            {u.name} ({u.email})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Home;
