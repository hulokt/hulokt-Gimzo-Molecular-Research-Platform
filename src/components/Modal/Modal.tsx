import React from "react";

interface ModalProps {
  id: string;
  title: string;
  content: React.ReactNode;
  onCloseText?: string;
}

const Modal: React.FC<ModalProps> = ({ id, title, content, onCloseText = "Close" }) => {
  return (
    <dialog id={id} className="modal">
      <div className="modal-box bg-white text-black">
        <h3 className="text-lg font-bold">{title}</h3>
        <div className="py-4">{content}</div>
        <div className="modal-action">
          <form method="dialog">
            <button className="btn">{onCloseText}</button>
          </form>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
};

export default Modal;

