import React, { Suspense, lazy, useEffect, useId, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useReducedMotion,
  useScroll,
  useSpring,
} from "motion/react";
import { services, steps } from "./data";
import "./styles.css";

const TerrainScene = lazy(() => import("./TerrainScene"));
const routes = ["home", "about", "services", "lands", "contact"];
const names = ["Home", "Our story", "Services", "Explore lands", "Contact"];
function readRoute() {
  const [path, query = ""] = location.hash.replace(/^#\/?/, "").split("?");
  return {
    page: routes.includes(path) ? path : "home",
    params: new URLSearchParams(query),
  };
}
const asset = (name) => `${import.meta.env.BASE_URL}assets/${name}`;
const href = (page, service) =>
  `#/${page}${service ? "?service=" + encodeURIComponent(service) : ""}`;
function Arrow({ direction = "diagonal" }) {
  const paths = {
    diagonal: "M6 18 18 6M6 6h12v12",
    right: "M4 12h16M13 5l7 7-7 7",
    down: "M12 4v16M5 13l7 7 7-7",
  };
  return (
    <svg className="arrow-icon" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={paths[direction] || paths.diagonal} />
    </svg>
  );
}
function LinkButton({ children, to = "contact", light = false }) {
  return (
    <a className={`button ${light ? "light" : ""}`} href={href(to)}>
      {children}
      <Arrow />
    </a>
  );
}
function Reveal({ children, className = "" }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.7 }}
    >
      {children}
    </motion.div>
  );
}
function Tilt({ children, className = "" }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  function move(e) {
    if (
      reduce ||
      e.pointerType === "touch" ||
      document.documentElement.dataset.motion === "off"
    )
      return;
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty(
      "--rx",
      `${(-(e.clientY - r.top - r.height / 2) / r.height) * 10}deg`,
    );
    ref.current.style.setProperty(
      "--ry",
      `${((e.clientX - r.left - r.width / 2) / r.width) * 12}deg`,
    );
  }
  return (
    <div
      ref={ref}
      className={`tilt ${className}`}
      onPointerMove={move}
      onPointerLeave={() => {
        ref.current.style.setProperty("--rx", "0deg");
        ref.current.style.setProperty("--ry", "0deg");
      }}
    >
      {children}
    </div>
  );
}
function Brand() {
  const emblemFilter = `emblem-${useId().replace(/:/g, "")}`;
  return (
    <a className="brand" href="#/home" aria-label="Vihar Earth home">
      <svg className="brand-symbol" viewBox="530 130 350 350"
        width="48" height="48" aria-hidden="true" focusable="false">
        <defs>
          <filter id={emblemFilter} x="530" y="130" width="350" height="350"
            filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            {/* Extract the original ink while making the photographed paper transparent. */}
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -0.2126 -0.7152 -0.0722 0 1" />
            <feComponentTransfer result="ink">
              <feFuncA type="linear" slope="3" intercept="-0.5" />
            </feComponentTransfer>
            <feFlood floodColor="#896a40" />
            <feComposite in2="ink" operator="in" />
          </filter>
        </defs>
        <image href={asset("logo.jpeg")} x="0" y="0" width="1408" height="768"
          filter={`url(#${emblemFilter})`} />
      </svg>
      <span>
        VIHAR EARTH<small>LAND & ESTATES</small>
      </span>
    </a>
  );
}
function Header({ page }) {
  const [open, setOpen] = useState(false);
  const toggle = useRef(null);
  useEffect(() => setOpen(false), [page]);
  useEffect(() => {
    const escape = (e) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open]);
  return (
    <header>
      <Brand />
      <nav
        id="main-nav"
        className={open ? "open" : ""}
        aria-label="Main navigation"
      >
        {routes.map((route, i) => (
          <a
            key={route}
            href={href(route)}
            aria-current={page === route ? "page" : undefined}
            onClick={() => setOpen(false)}
          >
            {names[i]}
          </a>
        ))}
      </nav>
      <div className="header-actions">
        <a className="talk-link" href="#/contact">
          Let’s talk <Arrow />
        </a>
        <button
          ref={toggle}
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="main-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen(!open)}
        >
          {open ? "×" : "☰"}
        </button>
      </div>
    </header>
  );
}
function Footer() {
  return (
    <>
      <section className="closing">
        <div className="closing-orbit" />
        <Reveal>
          <span className="eyebrow">A NEW CHAPTER, GROUNDED IN YOU</span>
          <h2>
            Your place in the world
            <br />
            is waiting.
          </h2>
        </Reveal>
        <LinkButton light>Let’s find it together</LinkButton>
      </section>
      <footer>
        <div className="footer-grid">
          <div>
            <Brand />
            <p>Land. Nature. Legacy.</p>
          </div>
          <div>
            <span className="eyebrow">EXPLORE</span>
            <a href="#/about">Our story</a>
            <a href="#/services">Our expertise</a>
            <a href="#/lands">Land possibilities</a>
          </div>
          <div>
            <span className="eyebrow">GET IN TOUCH</span>
            <a href="tel:+919970567798">+91 99705 67798</a>
            <a href="mailto:bhansaris@gmail.com">bhansaris@gmail.com</a>
            <span>Ratnagiri, Maharashtra</span>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Vihar Earth · Land & Estates</span>
          <span>Grounded in trust. Inspired by nature.</span>
        </div>
      </footer>
    </>
  );
}
function Process() {
  return (
    <section className="section container">
      <Reveal className="section-heading">
        <div>
          <span className="eyebrow">THE JOURNEY, MADE CLEAR</span>
          <h2>
            From a possibility
            <br />
            to a place of your own.
          </h2>
        </div>
        <p>
          A considered process.
          <br />A human connection at every step.
        </p>
      </Reveal>
      <div className="steps">
        {steps.map(([title, text], i) => (
          <Reveal key={title}>
            <span className="step-number">0{i + 1}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
function PageIntro({ label, title, accent, text }) {
  return (
    <section className="page-intro container">
      <span className="eyebrow">{label}</span>
      <h1>
        {title}
        <br />
        <em>{accent}</em>
      </h1>
      <p>{text}</p>
    </section>
  );
}
function Home({ paused }) {
  const [scene, setScene] = useState(0);
  const scenes = [
    { image: "fields", tag: "SPACE TO BECOME", name: "Open countryside" },
    { image: "coast", tag: "MEET THE HORIZON", name: "Coastal possibilities" },
    { image: "forest", tag: "CLOSER TO NATURE", name: "Farms & forests" },
  ];
  return (
    <>
      <section className="hero">
        <AnimatePresence mode="sync">
          <motion.img
            key={scene}
            className="hero-photo"
            src={asset(`${scenes[scene].image}.jpg`)}
            alt={`Illustrative ${scenes[scene].name.toLowerCase()} landscape`}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
          />
        </AnimatePresence>
        <div className="hero-overlay" />
        <div className="hero-copy">
          <motion.span
            className="eyebrow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            RATNAGIRI, MAHARASHTRA · LAND & ESTATES
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2 }}
          >
            A piece of earth.
            <br />A world of
            <br />
            <em>possibilities.</em>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            For the home you imagine. The roots you put down.
            <br />
            The legacy you leave behind.
          </motion.p>
          <div className="hero-buttons">
            <LinkButton to="lands" light>
              Find your possibilities
            </LinkButton>
            <a className="text-link" href="#/about">
              Our story <Arrow direction="right" />
            </a>
          </div>
        </div>
        <div className="hero-terrain">
          <Suspense fallback={<div className="terrain-fallback">◎</div>}>
            <TerrainScene paused={paused} />
          </Suspense>
          <div className="terrain-caption">
            <span className="tiny-dot" /> MOVE TO EXPLORE THE LAY OF THE LAND
          </div>
        </div>
        <div className="hero-bottom">
          <div className="scene-switcher" aria-label="Choose landscape">
            {scenes.map((s, i) => (
              <button
                key={s.image}
                aria-label={`View ${s.name}`}
                aria-pressed={scene === i}
                className={scene === i ? "active" : ""}
                onClick={() => setScene(i)}
              >
                0{i + 1}
                <span>{s.name}</span>
              </button>
            ))}
          </div>
          <a
            className="scroll-down"
            href="#welcome"
            onClick={(e) => {
              e.preventDefault();
              document
                .querySelector("#welcome")
                ?.scrollIntoView({ behavior: paused ? "instant" : "smooth" });
            }}
          >
            SCROLL TO EXPLORE <Arrow direction="down" />
          </a>
        </div>
      </section>
      <div className="belief-strip">
        <span>LOCAL UNDERSTANDING</span>
        <i>✧</i>
        <span>THOUGHTFUL GUIDANCE</span>
        <i>✧</i>
        <span>CLEAR DOCUMENTATION</span>
        <i>✧</i>
        <span>LASTING RELATIONSHIPS</span>
      </div>
      <section className="section container intro-grid" id="welcome">
        <Reveal>
          <Tilt className="arch-composition">
            <img
              src={asset("forest.jpg")}
              alt="Green forest in Matheran, Maharashtra, India"
              loading="lazy"
            />
            <div className="arch-outline" />
            <div className="floating-note">
              <span className="eyebrow">OUR PHILOSOPHY</span>
              <span>
                Good things begin
                <br />
                with solid ground.
              </span>
              <span className="note-symbol">✧</span>
            </div>
          </Tilt>
        </Reveal>
        <Reveal>
          <span className="eyebrow">WELCOME TO VIHAR EARTH</span>
          <h2>
            Some see land.
            <br />
            You see <em>a future.</em>
          </h2>
          <p>
            A home closer to nature. An orchard to nurture. A slower, richer way
            of life. Your vision is personal. Finding the right land should be,
            too.
          </p>
          <p>
            We bring local understanding and careful attention to the details,
            helping you explore land and estates with clarity at every step.
          </p>
          <a className="underlined" href="#/about">
            Discover our approach <Arrow />
          </a>
        </Reveal>
      </section>
      <section className="collection section">
        <div className="container">
          <Reveal className="section-heading">
            <div>
              <span className="eyebrow">LANDSCAPES OF POSSIBILITY</span>
              <h2>
                What does your
                <br />
                <em>next chapter</em> look like?
              </h2>
            </div>
            <a className="underlined" href="#/lands">
              Explore all land types <Arrow />
            </a>
          </Reveal>
          <div className="collection-grid">
            {[services[4], services[5], services[2]].map((s, i) => (
              <Reveal key={s.name}>
                <Tilt className="land-visual">
                  <a href={`#/lands?type=${s.category}`}>
                    <img
                      src={asset(`${s.image}.jpg`)}
                      alt={`Illustrative ${s.name.toLowerCase()} landscape`}
                      loading="lazy"
                    />
                    <span className="visual-number">0{i + 1}</span>
                    <div className="land-caption">
                      <span className="eyebrow">{s.tag}</span>
                      <h3>{s.name}</h3>
                      <span className="circle-arrow"><Arrow /></span>
                    </div>
                  </a>
                </Tilt>
              </Reveal>
            ))}
          </div>
          <p className="fine-print">
            Illustrative landscapes. Contact us for current opportunities.
          </p>
        </div>
      </section>
      <section className="expertise-banner container">
        <span className="eyebrow">
          FROM THE FIRST QUESTION TO THE FINAL PAPER
        </span>
        <h2>
          Eight areas of expertise.
          <br />
          One thoughtful approach.
        </h2>
        <div className="service-chips">
          {services.map((s) => (
            <a key={s.name} href={href("contact", s.name)}>
              {s.name}
              <Arrow />
            </a>
          ))}
        </div>
        <LinkButton to="services">Discover our services</LinkButton>
      </section>
      <Process />
    </>
  );
}
function About() {
  return (
    <>
      <PageIntro
        label="OUR STORY"
        title="Grounded in trust."
        accent="Connected to you."
        text="Buying land should feel as solid as the ground itself. That simple belief is at the heart of Vihar Earth."
      />
      <Reveal className="panorama container">
        <img
          src={asset("fields.jpg")}
          alt="Indian paddy fields framed by palm trees"
        />
        <span>A little closer to what matters.</span>
      </Reveal>
      <section className="section container intro-grid">
        <Reveal>
          <span className="eyebrow">LAND & ESTATES, WITH PURPOSE</span>
          <h2>
            A meaningful decision.
            <br />
            <em>A personal approach.</em>
          </h2>
        </Reveal>
        <Reveal>
          <p>
            Based in Ratnagiri, Maharashtra, Vihar Earth helps families and
            investors explore land and estates with a practical, considered
            approach.
          </p>
          <p>
            Our work brings together on-site knowledge, careful checking of
            titles and records, and documentation support. We want you to
            understand the opportunity as well as the questions that need
            answering.
          </p>
          <a className="underlined" href="#/contact">
            Speak with Sunil Bhansari <Arrow />
          </a>
        </Reveal>
      </section>
      <div className="container principles">
        {[
          [
            "Understand first",
            "Your purpose, budget and priorities shape the search.",
          ],
          [
            "Look a little closer",
            "Site visits and records help turn possibilities into informed decisions.",
          ],
          [
            "Keep it clear",
            "Honest conversations, clear pricing and support through the process.",
          ],
        ].map(([t, d], i) => (
          <Reveal key={t}>
            <span className="eyebrow">0{i + 1} / OUR VALUES</span>
            <h3>{t}</h3>
            <p>{d}</p>
          </Reveal>
        ))}
      </div>
      <Process />
    </>
  );
}
function Services() {
  return (
    <>
      <PageIntro
        label="OUR EXPERTISE"
        title="Every kind of land."
        accent="Every detail considered."
        text="From a coastal plot to a productive orchard, explore eight areas of service shaped around your plans."
      />
      <section className="container service-grid">
        {services.map((s, i) => (
          <Reveal key={s.name}>
            <Tilt className="service-card">
              <span className="service-index">0{i + 1}</span>
              <span className="service-icon" aria-hidden="true">
                {s.icon}
              </span>
              <span className="eyebrow">{s.tag}</span>
              <h2>{s.name}</h2>
              <p>{s.text}</p>
              <a className="underlined" href={href("contact", s.name)}>
                Let’s discuss your plans <Arrow />
              </a>
            </Tilt>
          </Reveal>
        ))}
      </section>
      <section className="container classification">
        <span className="eyebrow">THE DETAILS MATTER</span>
        <h3>Begin with the land’s existing classification.</h3>
        <p>
          These categories describe the enquiries we support. Suitability,
          permissions and availability depend on the individual parcel. Share
          your intended use so the relevant records and requirements can be
          reviewed.
        </p>
      </section>
      <Process />
    </>
  );
}
function Lands({ params }) {
  const filters = [
    ["all", "All possibilities"],
    ["residential", "Residential"],
    ["farms", "Farms & orchards"],
    ["coastal", "Coastal"],
    ["open", "Open & forest land"],
  ];
  const initial = params.get("type");
  const [filter, setFilter] = useState(
    filters.some(([v]) => v === initial) ? initial : "all",
  );
  useEffect(() => {
    const value = params.get("type");
    setFilter(filters.some(([v]) => v === value) ? value : "all");
  }, [params.toString()]);
  const items = services.filter(
    (s, i) =>
      ![0, 3].includes(i) && (filter === "all" || s.category === filter),
  );
  return (
    <>
      <PageIntro
        label="EXPLORE THE POSSIBILITIES"
        title="Find your landscape."
        accent="Imagine your life here."
        text="A home near nature. An orchard to nurture. A coastal retreat. Start with the kind of place that speaks to you."
      />
      <section className="container browse">
        <div className="filters" role="group" aria-label="Filter land types">
          {filters.map(([value, label]) => (
            <button
              key={value}
              aria-pressed={filter === value}
              onClick={() => {
                location.hash = `/lands${value === "all" ? "" : "?type=" + value}`;
              }}
              className={filter === value ? "active" : ""}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="result-count" aria-live="polite">
          {items.length} land types to explore
        </p>
        <motion.div layout className="explore-grid">
          <AnimatePresence mode="popLayout">
            {items.map((s) => (
              <motion.article
                layout
                key={s.name}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.35 }}
              >
                <Tilt>
                  <div className="explore-image">
                    <img
                      src={asset(`${s.image}.jpg`)}
                      alt={`Illustrative ${s.name.toLowerCase()} landscape`}
                    />
                    <span>LAND POSSIBILITIES</span>
                  </div>
                  <div className="explore-copy">
                    <span className="eyebrow">{s.tag}</span>
                    <h2>{s.name}</h2>
                    <p>{s.text}</p>
                    <a className="underlined" href={href("contact", s.name)}>
                      Explore this possibility <Arrow />
                    </a>
                  </div>
                </Tilt>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
        <p className="fine-print">
          These are land categories, not active property listings. Images are
          illustrative. Current availability, locations and pricing are shared
          on enquiry.
        </p>
      </section>
    </>
  );
}
function Contact({ params }) {
  const requested = params.get("service");
  const service = services.some(s => s.name === requested) ? requested : null;
  return (
    <>
      <PageIntro
        label="LET’S TALK LAND"
        title="Every possibility begins"
        accent="with a conversation."
        text="Tell us a little about your plans. Let’s explore your next chapter together."
      />
      <section className="container contact-grid">
        <Reveal>
          <span className="eyebrow">YOUR POINT OF CONTACT</span>
          <h2>Sunil Bhansari</h2>
          <p>Land, estates, and a clear way forward.</p>
          <div className="contact-item">
            <span>CALL US</span>
            <a href="tel:+919970567798">
              +91 99705 67798 <Arrow />
            </a>
          </div>
          <div className="contact-item">
            <span>WRITE TO US</span>
            <a href="mailto:bhansaris@gmail.com">
              bhansaris@gmail.com <Arrow />
            </a>
          </div>
          <div className="contact-item">
            <span>BASED IN</span>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Ratnagiri%2C+Maharashtra"
              target="_blank"
              rel="noreferrer"
            >
              Ratnagiri, Maharashtra <Arrow />
            </a>
          </div>
        </Reveal>
        <Reveal className="contact-invitation">
          <span className="eyebrow">LET?S MAKE IT PERSONAL</span>
          <h2>Your vision.<br /><em>Our next conversation.</em></h2>
          <p>{service ? `Interested in ${service.toLowerCase()}? Talk to us about your preferred location, budget and plans.` : "A future home, a farm, or a place closer to nature. Tell us what you have in mind, and let?s explore the possibilities."}</p>
          <a className="button" href="tel:+919970567798">Call Sunil Bhansari <Arrow /></a>
          <a className="underlined" href="mailto:bhansaris@gmail.com">Email us directly <Arrow /></a>
          <div className="visit-note"><span className="eyebrow">PLANNING A SITE VISIT?</span><p>Call us to discuss suitable locations and arrange a time to walk the land together.</p></div>
        </Reveal>
      </section>
      <section className="container faq">
        <span className="eyebrow">BEFORE WE BEGIN</span>
        <h2>A few helpful answers.</h2>
        {[
          [
            "Can I arrange a site visit?",
            "Yes. Call or email with your preferred land type and location so we can discuss suitable options and coordinate a visit.",
          ],
          [
            "What should I share in my enquiry?",
            "Your intended use, preferred location, approximate area and budget are useful starting points. You can also share your expected timeline.",
          ],
          [
            "Where can I find prices and availability?",
            "Contact Sunil Bhansari for current opportunities and parcel-specific details. The landscapes and categories on this website are illustrative.",
          ],
        ].map(([q, a]) => (
          <details key={q}>
            <summary>
              {q}
              <span aria-hidden="true">+</span>
            </summary>
            <p>{a}</p>
          </details>
        ))}
      </section>
    </>
  );
}
function App() {
  const [route, setRoute] = useState(readRoute);
  const reduced = useReducedMotion();
  const paused = !!reduced;
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const main = useRef(null);
  const first = useRef(true);
  useEffect(() => {
    const change = () => setRoute(readRoute());
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.motion = paused ? "off" : "on";
  }, [paused]);
  useEffect(() => {
    document.title = `Vihar Earth | ${names[routes.indexOf(route.page)]}`;
    window.scrollTo({ top: 0, behavior: "instant" });
    if (!first.current) main.current?.focus({ preventScroll: true });
    first.current = false;
  }, [route.page]);
  const content =
    route.page === "home" ? (
      <Home paused={paused} />
    ) : route.page === "about" ? (
      <About />
    ) : route.page === "services" ? (
      <Services />
    ) : route.page === "lands" ? (
      <Lands params={route.params} />
    ) : (
      <Contact params={route.params} />
    );
  return (
    <MotionConfig
      reducedMotion={paused ? "always" : "user"}
      transition={paused ? { duration: 0 } : { duration: 0.5 }}
    >
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          main.current?.focus();
        }}
      >
        Skip to content
      </a>
      <motion.div className="scroll-progress" style={{ scaleX: progress }} />
      <Header page={route.page} />
      <main ref={main} id="main" tabIndex={-1}>
        <AnimatePresence mode="wait">
          <motion.div
            key={route.page}
            initial={{ opacity: 0, y: paused ? 0 : 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: paused ? 0 : -10 }}
            transition={{ duration: paused ? 0 : 0.28 }}
          >
            {content}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </MotionConfig>
  );
}
createRoot(document.getElementById("root")).render(<App />);
