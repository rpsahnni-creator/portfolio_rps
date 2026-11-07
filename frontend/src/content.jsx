import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { projects as defProjects, skills as defSkills, testimonials as defTestimonials } from "./data";

import { API, absUrl } from "./lib/backend";
export { absUrl };

const DEFAULTS = { projects: defProjects, skills: defSkills, testimonials: defTestimonials, resumeUrl: "" };
const Ctx = createContext(DEFAULTS);


export function ContentProvider({ children }) {
  const [content, setContent] = useState(DEFAULTS);
  useEffect(() => {
    axios
      .get(`${API}/content`)
      .then(({ data }) => {
        setContent({
          projects: (data.projects?.length ? data.projects : defProjects).map((p) => ({ ...p, img: absUrl(p.img) })),
          skills: data.skills?.length ? data.skills : defSkills,
          testimonials: data.testimonials?.length ? data.testimonials : defTestimonials,
          resumeUrl: data.resumeUrl ? absUrl(data.resumeUrl) : "",
        });
      })
      .catch(() => {});
  }, []);
  return <Ctx.Provider value={content}>{children}</Ctx.Provider>;
}

export const useContent = () => useContext(Ctx);
