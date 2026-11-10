/**
 * Original, hand-authored colored-outline SVG pictograms.
 * No IconScout assets are bundled with this POC.
 */
(() => {
  const S = '#24345f';
  const C = {
    blue: '#8bd3ff', violet: '#c8b2ff', lime: '#a5efc9', orange: '#ffcd81',
    pink: '#ffb2c9', yellow: '#ffe28c', white: '#ffffff', teal: '#8ee3de'
  };
  const wrap = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true" fill="none"><g stroke="${S}" stroke-width="3.7" stroke-linejoin="round" stroke-linecap="round">${body}</g></svg>`;
  const defs = [
    ['browser', 'Navigateur', 'Client', C.blue, `<rect x="11" y="21" width="78" height="59" rx="9" fill="${C.white}"/><path d="M11 35h78"/><circle cx="21" cy="28" r="2.5" fill="${C.pink}"/><circle cx="30" cy="28" r="2.5" fill="${C.yellow}"/><circle cx="39" cy="28" r="2.5" fill="${C.lime}"/><rect x="20" y="45" width="24" height="25" rx="4" fill="${C.violet}"/><path d="m55 49 8 7-8 7m20-14-8 7 8 7"/>`],
    ['mobile', 'Mobile', 'Client', C.pink, `<rect x="29" y="9" width="42" height="82" rx="10" fill="${C.white}"/><rect x="35" y="21" width="30" height="51" rx="3" fill="${C.blue}"/><path d="M44 16h12"/><circle cx="50" cy="81" r="3" fill="${C.pink}"/><path d="M41 42h18M41 51h11"/>`],
    ['desktop', 'Poste client', 'Client', C.violet, `<rect x="11" y="16" width="78" height="52" rx="7" fill="${C.white}"/><path d="M11 56h78M50 68v13M33 83h34"/><rect x="21" y="26" width="58" height="23" rx="3" fill="${C.blue}"/><path d="m38 33-5 5 5 5m24-10 5 5-5 5"/>`],
    ['api', 'API REST', 'Application', C.violet, `<path d="M24 27 50 12l26 15v44L50 86 24 71Z" fill="${C.violet}"/><rect x="35" y="37" width="30" height="24" rx="6" fill="${C.white}"/><path d="M39 54v-9l4-3 4 3v9m-8-4h8m5 4V42h6q7 0 0 7h-6m11-7v12" stroke-width="3"/>`],
    ['server', 'Serveur', 'Infrastructure', C.blue, `<rect x="22" y="15" width="56" height="70" rx="6" fill="${C.white}"/><rect x="28" y="22" width="44" height="17" rx="4" fill="${C.blue}"/><rect x="28" y="43" width="44" height="17" rx="4" fill="${C.violet}"/><rect x="28" y="64" width="44" height="15" rx="4" fill="${C.lime}"/><circle cx="36" cy="30" r="2" fill="${C.white}"/><circle cx="36" cy="51" r="2" fill="${C.white}"/><circle cx="36" cy="71" r="2" fill="${C.white}"/><path d="M46 30h17M46 51h17M46 71h17"/>`],
    ['container', 'Conteneur', 'Infrastructure', C.teal, `<path d="M14 32 50 13l36 19v37L50 89 14 69Z" fill="${C.teal}"/><path d="M14 32 50 51l36-19M50 51v38M32 23l37 20M68 23 30 43M26 53v15M36 57v17M64 57v17M74 53v15"/>`],
    ['cloud', 'Cloud', 'Infrastructure', C.blue, `<path d="M27 72h48c12 0 18-9 15-19-2-8-10-12-19-11C67 24 44 18 32 36 11 34 4 57 17 68c3 3 6 4 10 4Z" fill="${C.blue}"/><path d="M37 57h26M50 46v23m-8-7 8 7 8-7"/>`],
    ['database', 'Base SQL', 'Données', C.orange, `<ellipse cx="50" cy="22" rx="28" ry="12" fill="${C.yellow}"/><path d="M22 22v52c0 16 56 16 56 0V22" fill="${C.orange}"/><path d="M22 40c0 15 56 15 56 0M22 58c0 15 56 15 56 0"/><path d="M35 34h3M35 52h3M35 70h3" stroke="${C.white}" stroke-width="5"/>`],
    ['cache', 'Redis / cache', 'Données', C.pink, `<path d="m17 38 33-15 33 15-33 15Z" fill="${C.pink}"/><path d="m17 50 33 15 33-15M17 61l33 16 33-16M17 72l33 16 33-16"/><path d="m17 38 33 15 33-15v12L50 65 17 50Z" fill="${C.orange}"/><path d="m17 61 33 16 33-16v11L50 88 17 72Z" fill="${C.pink}"/><path d="m43 36 7-4 7 4-7 4Z" fill="${C.white}"/>`],
    ['storage', 'Stockage', 'Données', C.lime, `<path d="M17 31h66v49H17z" fill="${C.lime}"/><path d="m17 31 10-14h46l10 14" fill="${C.white}"/><path d="M17 44h66M50 44v36M35 57h8m14 0h8M35 68h8m14 0h8"/>`],
    ['folder', 'Dossier', 'Données', C.yellow, `<path d="M13 29a6 6 0 0 1 6-6h20l8 9h34a6 6 0 0 1 6 6v36a6 6 0 0 1-6 6H19a6 6 0 0 1-6-6Z" fill="${C.orange}"/><path d="M13 42h74v32a6 6 0 0 1-6 6H19a6 6 0 0 1-6-6Z" fill="${C.yellow}"/><path d="M25 54h24"/>`],
    ['queue', 'File de messages', 'Données', C.yellow, `<rect x="9" y="21" width="23" height="23" rx="5" fill="${C.pink}"/><rect x="39" y="21" width="23" height="23" rx="5" fill="${C.yellow}"/><rect x="69" y="21" width="23" height="23" rx="5" fill="${C.blue}"/><path d="M20 44v22h60V44M50 44v22M20 66l-7-7m7 7 7-7m53 7-7-7m7 7 7-7"/><rect x="32" y="72" width="36" height="15" rx="4" fill="${C.lime}"/>`],
    ['gateway', 'API Gateway', 'Réseau', C.violet, `<rect x="23" y="14" width="54" height="72" rx="9" fill="${C.violet}"/><rect x="33" y="25" width="34" height="24" rx="4" fill="${C.white}"/><path d="M12 61h30m-6-7 7 7-7 7m52-7H58m6-7-7 7 7 7"/><circle cx="50" cy="68" r="7" fill="${C.yellow}"/>`],
    ['loadbalancer', 'Load balancer', 'Réseau', C.blue, `<rect x="32" y="8" width="36" height="24" rx="5" fill="${C.blue}"/><rect x="5" y="67" width="25" height="22" rx="5" fill="${C.lime}"/><rect x="38" y="67" width="25" height="22" rx="5" fill="${C.yellow}"/><rect x="71" y="67" width="25" height="22" rx="5" fill="${C.pink}"/><path d="M50 32v18H18v17m32-17v17m0-17h34v17"/><path d="M43 19h14"/>`],
    ['firewall', 'Pare-feu', 'Sécurité', C.orange, `<path d="M22 19h56v62H22Z" fill="${C.orange}"/><path d="M22 37h56M22 57h56M22 71h56M44 19v18m14 0v20M44 57v14M58 71v10"/><path d="m50 33 17 8v13q0 12-17 21Q33 66 33 54V41Z" fill="${C.white}"/><path d="m43 53 5 5 10-12"/>`],
    ['auth', 'Authentification', 'Sécurité', C.lime, `<path d="M27 45V31c0-30 46-30 46 0v14"/><rect x="18" y="42" width="64" height="47" rx="9" fill="${C.lime}"/><circle cx="50" cy="62" r="7" fill="${C.white}"/><path d="M50 69v9"/>`],
    ['monitoring', 'Supervision', 'Observabilité', C.yellow, `<rect x="10" y="18" width="80" height="63" rx="8" fill="${C.white}"/><path d="M19 66h62M21 52h12l8-19 12 28 9-18 5 9h13"/><circle cx="76" cy="30" r="6" fill="${C.lime}"/>`],
    ['terminal', 'Terminal', 'Outils', C.blue, `<rect x="13" y="19" width="74" height="61" rx="7" fill="${C.blue}"/><path d="M13 35h74"/><circle cx="24" cy="27" r="2" fill="${C.pink}"/><circle cx="33" cy="27" r="2" fill="${C.yellow}"/><path d="m26 50 12 9-12 9m19 0h20" stroke-width="5"/>`],
    ['git', 'CI / CD', 'Outils', C.pink, `<circle cx="27" cy="21" r="9" fill="${C.pink}"/><circle cx="27" cy="77" r="9" fill="${C.lime}"/><circle cx="72" cy="48" r="9" fill="${C.yellow}"/><path d="M27 30v38m0-27h27q18 0 18 7"/><path d="m48 36 7 5-7 5"/>`],
  ];
  const presets = defs.map(([id, name, group, color, body]) => ({ id, name, group, color, svg: wrap(body) }));
  window.ArchIcons = { presets, get: (id) => presets.find((icon) => icon.id === id) };
})();
