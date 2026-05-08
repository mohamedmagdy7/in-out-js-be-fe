// Inlined into <head> so the dark class is set before React hydrates.
// Avoids a flash of light theme on first paint for users who picked dark.
const SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var useDark = stored === 'dark' || (!stored && prefersDark);
    document.documentElement.classList.toggle('dark', useDark);
  } catch (_) {}
})();
`;

export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: SCRIPT }}
      suppressHydrationWarning
    />
  );
}
