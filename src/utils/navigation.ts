// An array of links for navigation bar
const navBarLinks = [
    { name: "Inicio", url: "/", icon: "home", },
    { name: "Blog", url: "/blog", icon: "noticias", },
    { name: "Estadisticas", url: "/statistics", icon: "noticias", },
    {name: "LBDTw Tv", url: "/lbdtwtv", icon: "noticias",}
  ];
  // An array of links for footer
  const footerLinks = [
    {
      section: "Ecosystem",
      links: [
        { name: "Documentation", url: "/welcome-to-docs/" },
        { name: "Tools & Equipment", url: "/products" },
        { name: "Construction Services", url: "/services" },
      ],
    },
    {
      section: "Company",
      links: [
        { name: "About us", url: "#" },
        { name: "Blog", url: "/blog" },
        { name: "Careers", url: "#" },
        { name: "Customers", url: "#" },
      ],
    },
  ];
  // An object of links for social icons
  const socialLinks = {
    facebook: "https://www.facebook.com/LBDTW/",
    x: "https://twitter.com/_lbdtw_",
    discord: "https://discord.com/invite/7EcJkeFMgc",
    twitch: "https://www.twitch.tv/lbdtwok",
    instagram: "https://www.instagram.com/lbdtw/",
    youtube: "https://www.youtube.com/user/LBDTW",
  };
  
  export default {
    navBarLinks,
    footerLinks,
    socialLinks,
  };