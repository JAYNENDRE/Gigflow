export function useNavigate() {
  return (path: string) => {
    window.location.hash = path;
  };
}

export function useLocation() {
  return window.location.hash.slice(1) || '/';
}
