import { siteConfig } from "../../site.config";

export default function Home() {
  return <main><h1>{siteConfig.title}</h1><p>{siteConfig.description}</p></main>;
}
