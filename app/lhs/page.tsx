"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Entry = {
  uid: string;
  user_name: string; 
  user_phone: string; 
  user_email: string; 
  city : string; 
  events: string[]; 
  amount_paid:  number;
};

const fakeEntries: Entry[] = [
  {
    uid: "Rohit_Sharma",
    user_name: "Rohit Sharma",
    user_email: "rohit.sharma@example.com",
    user_phone: "+91 9876543210",
    city: "Chandigarh",
    amount_paid: 500,
    events: [],
  },
  {
    uid: "Ananya_Gupta",
    user_name: "Ananya Gupta",
    user_email: "ananya.gupta@example.com",
    user_phone: "+91 9123456780",
    city: "Chandigarh",
    amount_paid: 1100,
    events: [],
  },
  {
    uid: "Karan_Mehta",
    user_name: "Karan Mehta",
    user_email: "karan.mehta@example.com",
    user_phone: "+91 9988776655",
    city: "Chandigarh",
    amount_paid: 500,
    events: [],
  },
  {
    uid: "Sneha_Reddy",
    user_name: "Sneha Reddy",
    user_email: "sneha.reddy@example.com",
    user_phone: "+91 9090909090",
    city: "Chandigarh",
    amount_paid: 1100,
    events: [],
  },
  {
    uid: "Arjun_Patel",
    user_name: "Arjun Patel",
    user_email: "arjun.patel@example.com",
    user_phone: "+91 9812345678",
    city: "Chandigarh",
    amount_paid: 500,
    events: [],
  },
  {
    uid: "Priya_Nair",
    user_name: "Priya Nair",
    user_email: "priya.nair@example.com",
    user_phone: "+91 9765432109",
    city: "Chandigarh",
    amount_paid: 1100,
    events: [],
  },
  {
    uid: "Vikram_Singh",
    user_name: "Vikram Singh",
    user_email: "vikram.singh@example.com",
    user_phone: "+91 9345678123",
    city: "Chandigarh",
    amount_paid: 500,
    events: [],
  },
]

export function TableData({ items }: { items: Entry[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone Number</TableHead>
          <TableHead>City</TableHead>
          <TableHead className="text-right">Accommodation Type</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.user_email + item.user_phone}>
            <TableCell className="font-medium">{item.user_name}</TableCell>
            <TableCell>{item.user_email}</TableCell>
            <TableCell>{item.user_phone}</TableCell>
            <TableCell>{item.city}</TableCell>
            <TableCell className="text-right">{item.amount_paid.toString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}


function Protected({
  password
}: {
  password: string
}) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/lhs', {
          method: "POST",
          body: JSON.stringify({ password })
        });
        if (res.status >= 200 && res.status < 300) {
          setEntries(await res.json());
        } else {
          toast('Failed to fetch entries');
        }
      } catch {
        toast('Failed to fetch entries');
      }
    })()
  }, []);

  const filteredEntries = useMemo(() => {
    if (search.length == 0) return entries;
    return entries.filter((entry) => {
      return `${entry.user_name} ${entry.user_phone} ${entry.user_email} ${entry.amount_paid}`.toLowerCase().includes(search);
    });
  }, [search, entries]);

  return <div>
    <Header />
    <div className="w-[80vw] m-auto mt-32 mb-32">
      <Input
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value.toLowerCase())}
      />
      <TableData items={filteredEntries} />
    </div>
    <Footer />
  </div>;
}

export default function Page() {
  const [password, setPassword] = useState('');
  const [passwordSubmitted, setPasswordSubmitted] = useState(false)

  async function verifyPassword() {
    setPasswordSubmitted(true);
  }

  if (passwordSubmitted) {
    return <Protected password={password} />;
  }

  return <div>
    <Header />
    <div className="flex gap-2 w-[80vw] m-auto mt-32 mb-32">
      <Input
        placeholder="Enter Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button onClick={verifyPassword}>Submit</Button>
    </div>
    <Footer />
  </div>
}
