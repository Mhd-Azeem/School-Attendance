import { describe,it,expect } from 'vitest'
import { percentage,totals } from './attendance'
describe('attendance calculations',()=>{
  it('counts each status',()=>expect(totals({a:'PRESENT',b:'ABSENT',c:'LATE',d:'PRESENT'})).toEqual({present:2,absent:1,late:1}))
  it('calculates attendance percentage with late counted attending',()=>expect(percentage(31,1,35)).toBe(91.4))
  it('handles empty classes',()=>expect(percentage(0,0,0)).toBe(0))
})

