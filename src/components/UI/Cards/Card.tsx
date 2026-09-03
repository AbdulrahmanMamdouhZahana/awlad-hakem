import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

const Card = ({ children, className = "", hover = true, onClick }: CardProps) => {
  return (
    <div
      className={`
        overflow-hidden rounded-3xl border border-slate-200 bg-white 
        shadow-sm transition duration-300 
        ${hover ? "hover:-translate-y-1 hover:shadow-xl" : ""}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;