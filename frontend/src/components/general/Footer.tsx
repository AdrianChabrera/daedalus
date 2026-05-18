import { FaGithub, FaLinkedin, FaDiscord, FaServer } from 'react-icons/fa';
import styles from '../../styles/Footer.module.css';

const GITHUB_URL   = 'https://github.com/AdrianChabrera/daedalus';
const LINKEDIN_URL = 'https://linkedin.com/in/adrián-chabrera-rubio-2846b13a5';
//TODO: add discord url when server is ready
const DISCORD_URL  = 'https://discord.gg';
const BUILDCORES_URL = 'https://github.com/buildcores/buildcores-open-db';

  const PROJECT_DESCRIPTION = (
  <>
    <br />
    Daedalus is a free and open-source PC build sharing platform where users can discover, share, and review custom builds, with a built-in compatibility checker to ensure components work seamlessly together. Component data is sourced from the BuildCores OpenDB public repository. Check their GitHub page to see their work.    
    <br /><br />
    This project is the result of a Final Year Project for the software engineering degree at the University of Seville. However, it is planned to be extended and improved in the future, so contributions are more than welcome! You can report bugs, suggest features, or just say hi on the official Discord server!
  </>
);
export default function Footer() {
  const year = 2026;

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>

        <div className={styles.brand}>
          <p className={styles.logoText}>DAEDALUS</p>
          <p className={styles.description}>{PROJECT_DESCRIPTION}</p>
        </div>

        <div className={styles.divider} aria-hidden="true" />

        <nav className={styles.links} aria-label="links">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
            aria-label="GitHub"
          >
            <FaGithub size={15} />
            <span>GitHub</span>
          </a>

          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
            aria-label="Linkedin"
          >
            <FaLinkedin size={15} />
            <span>LinkedIn</span>
          </a>

          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.link} ${styles.discord}`}
            aria-label="Discord server"
          >
            <FaDiscord size={15} />
            <span>Discord</span>
          </a>

          <a
            href={BUILDCORES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
            aria-label="BuildCores OpenDB GitHub"
          >
            <FaServer size={15} />
            <span>BuildCores</span>
          </a>
        </nav>

      </div>

      <div className={styles.bar}>
        <span>© {year} Daedalus.</span>
      </div>
    </footer>
  );
}