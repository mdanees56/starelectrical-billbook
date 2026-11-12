import { X } from 'lucide-react'

export function Panel({title,children}) { return <div className="panel"><h3>{title}</h3>{children}</div> }
export function Empty({text}) { return <p className="empty">{text}</p> }
export function Modal({title,children,close}) { return <div className="modal-backdrop" onMouseDown={close}><div className="modal" onMouseDown={e=>e.stopPropagation()}><div className="modal-head"><h2>{title}</h2><button className="icon" onClick={close}><X/></button></div>{children}</div></div> }
