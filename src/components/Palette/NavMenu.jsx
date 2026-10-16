const icon = `data:image/svg+xml;utf8,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1fb556" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="4" cy="6" r="1.5"/><circle cx="4" cy="12" r="1.5"/><circle cx="4" cy="18" r="1.5"/><path d="M9 6h12M9 12h12M9 18h12"/></svg>'
)}`;

const NavMenu = () => {
    return <img src={icon} alt="Nav Menu" />;
};

export default NavMenu;
