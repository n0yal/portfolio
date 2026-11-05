import { useCallback, useEffect, useRef, useState } from "react";
import { content } from "./content";
import type { Project } from "./content";
import { useReducedMotion } from "./lib/hooks";
import { BallField } from "./components/BallField";
import { CustomCursor } from "./components/CustomCursor";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { Intro } from "./components/Intro";
import { ProjectDetail } from "./components/ProjectDetail";
import { SignatureWall } from "./components/SignatureWall";
import { SiteBackground } from "./components/SiteBackground";
import { Work } from "./components/Work";

function normalizePath(path: string) {
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

function pathToProject(path: string): Project | null {
  const match = normalizePath(path).match(/^\/work\/([^/]+)$/);
  if (!match) return null;
  return content.projects.find((project) => project.slug === match[1]) ?? null;
}

export default function App() {
  const [path, setPath] = useState(() => normalizePath(window.location.pathname));
  const [introDone, setIntroDone] = useState(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return reduced || normalizePath(window.location.pathname) !== "/";
  });
  const [paused, setPaused] = useState(false);
  const [ballsActive, setBallsActive] = useState(introDone);
  const reducedMotion = useReducedMotion();
  const scrollLock = useRef(false);

  const project = pathToProject(path);

  useEffect(() => {
    if (reducedMotion) {
      setIntroDone(true);
      setBallsActive(true);
      setPaused(true);
    }
  }, [reducedMotion]);

  useEffect(() => {
    const onPopState = () => {
      setPath(normalizePath(window.location.pathname));
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (scrollLock.current) return;
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [path]);

  const navigate = useCallback((nextPath: string) => {
    if (normalizePath(window.location.pathname) !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
    setPath(nextPath);
    window.scrollTo({ top: 0, behavior: "instant" });
    scrollLock.current = true;
    window.setTimeout(() => {
      scrollLock.current = false;
    }, 0);
  }, []);

  const openProject = useCallback(
    (nextProject: Project) => {
      navigate(`/work/${nextProject.slug}`);
    },
    [navigate],
  );

  const backHome = useCallback(() => navigate("/"), [navigate]);
  const scrollTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, [reducedMotion]);

  useEffect(() => {
    if (path !== "/" && !project) {
      window.history.replaceState({}, "", "/");
      setPath("/");
    }
  }, [path, project]);

  return (
    <div className="site">
      <SiteBackground />

      {project ? (
        <ProjectDetail
          project={project}
          onBack={backHome}
          onOpenProject={openProject}
        />
      ) : (
        <div className={`home ${introDone ? "is-revealed" : "is-intro"}`}>
          <Hero
            introDone={introDone}
            paused={paused}
            showPlay={!reducedMotion}
            onTogglePlay={() => setPaused((value) => !value)}
          />
          <Work onOpenProject={openProject} />
          <SignatureWall />
          <Footer onTop={scrollTop} />

          <BallField active={ballsActive} paused={paused || reducedMotion} />

          {!introDone ? (
            <Intro
              onComplete={() => {
                setIntroDone(true);
                setBallsActive(true);
              }}
            />
          ) : null}
        </div>
      )}

      <CustomCursor enabled={introDone && !reducedMotion} resetKey={path} />
    </div>
  );
}
