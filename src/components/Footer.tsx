const Footer: React.FC = () => {
  return (
    <footer className="p-4 text-center bg-[#23243a] text-gray-400 shadow-inner border-t border-[#23243a]">
      © {new Date().getFullYear()} Trading Dashboard
    </footer>
  );
};

export default Footer;