
export const emptyProduct = { name:'', category:'', sku:'', brand:'', unit:'PCS', purchasePrice:'', sellingPrice:'', gst:'0', stock:'0', lowStock:'5', description:'' }
export const emptyCustomer = { name:'', mobile:'', address:'' }
export const today = () => new Date().toISOString().slice(0,10)
export const money = n => `\u20B9${Number(n || 0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`
export const readImage = file => new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)})
