import type { MetadataRoute } from "next";
export default function manifest():MetadataRoute.Manifest{return{name:"Agent Souq",short_name:"Agent Souq",description:"A curated marketplace for practical AI agents.",start_url:"/",display:"standalone",background_color:"#f7f7f2",theme_color:"#244c3b",icons:[{src:"/icon.svg",sizes:"any",type:"image/svg+xml"}]}}
