import LogoutButton from "./LogoutButton";

export default function Authenticated() {
  console.log("Should not log to browser");

  return (
    <>
      <LogoutButton />
      <h1>Authenticated</h1>
    </>
  );
}
