"use client";

import { Button } from "@aws-amplify/ui-react";
import { Auth } from "aws-amplify";
import { useRouter } from "next/navigation";

const signOut = () => Auth.signOut();

export default function LogoutButton() {
  const router = useRouter();
  const handleClick = async () => {
    await signOut();
    router.push("client");
  };
  return <Button onClick={handleClick}>Log Out</Button>;
}
