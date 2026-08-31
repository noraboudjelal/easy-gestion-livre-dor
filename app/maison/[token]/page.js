import MaisonClient from "./MaisonClient";

export const metadata = {
  title: "Lehnova Maison",
  description: "Le tableau familial simple et partagé.",
};

export default function MaisonPage({ params }) {
  return <MaisonClient token={params.token} />;
}
