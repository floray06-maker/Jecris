import { HomeActions } from "@/components/HomeActions";

export default function HomePage() {
  return (
    <main className="home">
      <header className="home-header">
        <span className="brand">
          <span className="brand-mark" aria-hidden="true" />
          Nos Réussites <strong>Visio</strong>
        </span>
      </header>

      <section className="home-hero">
        <h1>Des réunions vidéo simples, hébergées chez nous.</h1>
        <p className="home-lead">
          Créez une réunion en un clic et partagez le lien. Vos invités la rejoignent depuis leur
          navigateur, sans compte ni logiciel à installer.
        </p>
        <HomeActions />
      </section>
    </main>
  );
}
