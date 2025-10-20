export default function About() {
  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">About Us</h1>
        
        <div className="space-y-6 text-lg leading-relaxed">
          <p>
            Welcome to Transparenztool - your trusted partner for transparency
            and clarity in the digital world.
          </p>
          
          <p>
            Our mission is to provide innovative solutions that help businesses
            and individuals make informed decisions through transparent data
            and analytics.
          </p>
          
          <section className="mt-12">
            <h2 className="text-2xl font-semibold mb-4">Our Values</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Transparency in everything we do</li>
              <li>Innovation and continuous improvement</li>
              <li>User-centric design and experience</li>
              <li>Data privacy and security</li>
            </ul>
          </section>
          
          <section className="mt-12">
            <h2 className="text-2xl font-semibold mb-4">Get in Touch</h2>
            <p>
              Have questions? We'd love to hear from you. Reach out to our team
              and we'll get back to you as soon as possible.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
