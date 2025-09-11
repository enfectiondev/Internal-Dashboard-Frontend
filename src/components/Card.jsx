import React from "react";

function Card({ title, children, className }) {
  return (
    <div className={`bg-white text-gray-800 p-4 rounded-lg shadow-sm ${className || ""}`}>
      {title && <h3 className="font-semibold mb-4 text-gray-900">{title}</h3>}
      {children}
    </div>
  );
}

export default Card;