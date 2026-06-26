import React from 'react'

export default function Skeleton({className='h-4 w-full rounded', lines=1}){
  if(lines===1) return <div className={`skeleton ${className}`} />
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({length:lines}).map((_,i)=>(
        <div key={i} className={`skeleton h-4 rounded`}></div>
      ))}
    </div>
  )
}
