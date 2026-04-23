import { db } from './server/db';

type User = {
  id: string;
  email: string;
  name: string | null;
  created_at: number;
};

async function checkUsers() {
  const allUsers = db.prepare('SELECT * FROM users').all() as User[];
  console.log('Total users:', allUsers.length);
  console.log('Users:', JSON.stringify(allUsers.map((u: User) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    createdAt: u.created_at
  })), null, 2));
}

checkUsers().catch(console.error);
