import Link from "next/link";

export default function NotFound() {
  return (
    <main className="centered-message">
      <h1>Réunion introuvable</h1>
      <p>Le lien est incomplet ou le code ne correspond à aucun format de réunion valide.</p>
      <Link href="/" className="button button-primary">
        Retour à l’accueil
      </Link>
    </main>
  );
}
