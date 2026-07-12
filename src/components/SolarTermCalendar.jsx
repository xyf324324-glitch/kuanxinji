import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  CalendarBlank,
  CaretLeft,
  CaretRight,
  Leaf,
} from '@phosphor-icons/react'
import lunarPackage from 'lunar-javascript'
import kuanxinLogo from '../assets/kuanxin-logo-transparent.png'
import './SolarTermCalendar.css'

const { Solar } = lunarPackage

const weekLabels = ['日', '一', '二', '三', '四', '五', '六']

const solarTermNotes = {
  小寒: '寒意渐深，天地收藏。适合收拢心神，照顾作息。',
  大寒: '岁末极寒，也孕育新一轮生机。宜静候春信。',
  立春: '东风解冻，万物起始。适合整理计划，轻轻启程。',
  雨水: '气温回升，雨意渐多。感受土地与草木的苏醒。',
  惊蛰: '春雷初动，蛰虫惊醒。把迟疑放下，开始行动。',
  春分: '昼夜均分，寒暑平衡。提醒我们在进退之间守中。',
  清明: '气清景明，草木繁盛。适合踏青，也适合追思感念。',
  谷雨: '雨生百谷，春将向夏。顺势耕耘，珍惜生长的时日。',
  立夏: '万物并秀，夏日初长。让生活舒展，也留意劳逸相济。',
  小满: '麦粒渐满而未全满。小得盈满，正是从容的分寸。',
  芒种: '有芒之谷可种，亦是忙而有序的时节。',
  夏至: '白昼最长，阳气至盛。盛极之时，更宜保持清醒平和。',
  小暑: '暑气初盛，雷雨增多。放慢脚步，为身心留些余地。',
  大暑: '一年炎热至盛。少一些躁进，多一些安静与体察。',
  立秋: '凉风将至，万物渐收。整理盛夏所得，迎接清朗秋意。',
  处暑: '暑气到此渐止。天地转换，也给生活一次重新调息。',
  白露: '露凝而白，昼夜温差渐显。留意晨昏，也留意细微变化。',
  秋分: '昼夜再度均分。收获与舍放，都需要恰好的尺度。',
  寒露: '露水更寒，秋意深浓。适合登高望远，也适合向内安顿。',
  霜降: '霜始降，草木黄落。面对凋零，也看见收藏的智慧。',
  立冬: '水始冰，地始冻。由外向内，蓄养下一程的力量。',
  小雪: '寒意凝结，初雪将至。删繁就简，让日常更安静。',
  大雪: '雪意渐盛，天地闭藏。围炉、读书，守护温暖与清明。',
  冬至: '阴极阳生，白昼渐长。漫长夜色里，新的循环已经开始。',
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

function dateKey(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

function getLunarData(date) {
  const solar = Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate())
  const lunar = solar.getLunar()
  const nextTerm = lunar.getNextJieQi()
  const nextTermSolar = nextTerm.getSolar()

  return {
    lunar,
    lunarDay: lunar.getDayInChinese(),
    lunarMonth: `${lunar.getMonthInChinese()}月`,
    solarTerm: lunar.getJieQi(),
    yearGanZhi: lunar.getYearInGanZhi(),
    zodiac: lunar.getYearShengXiao(),
    dayGanZhi: lunar.getDayInGanZhi(),
    yi: lunar.getDayYi(),
    ji: lunar.getDayJi(),
    clash: lunar.getDayChongDesc(),
    sha: lunar.getDaySha(),
    nextTerm: {
      name: nextTerm.getName(),
      date: new Date(
        nextTermSolar.getYear(),
        nextTermSolar.getMonth() - 1,
        nextTermSolar.getDay(),
        nextTermSolar.getHour(),
        nextTermSolar.getMinute(),
      ),
    },
  }
}

function buildMonthDays(monthDate) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  return Array.from({ length: 42 }, (_, index) => (
    new Date(year, month, index - firstWeekday + 1)
  ))
}

function formatDate(date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

function TraditionList({ title, items, tone }) {
  const visibleItems = items.slice(0, 10)
  return (
    <section className={`tradition-list tradition-list--${tone}`}>
      <div className="tradition-list__heading">
        <span>{title}</span>
        <small>传统历法记载</small>
      </div>
      <div className="tradition-list__items">
        {visibleItems.map((item) => <span key={item}>{item}</span>)}
        {!visibleItems.length && <span>无特别记载</span>}
      </div>
    </section>
  )
}

function SolarTermCalendar({ onBack }) {
  const today = useMemo(() => new Date(), [])
  const [selectedDate, setSelectedDate] = useState(today)
  const [monthDate, setMonthDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const monthDays = useMemo(() => buildMonthDays(monthDate), [monthDate])
  const selectedData = useMemo(() => getLunarData(selectedDate), [selectedDate])
  const dayLookup = useMemo(() => new Map(monthDays.map((date) => [dateKey(date), getLunarData(date)])), [monthDays])
  const activeTermName = selectedData.solarTerm || selectedData.nextTerm.name
  const daysUntilTerm = Math.max(0, Math.ceil((selectedData.nextTerm.date - selectedDate) / 86400000))

  const moveMonth = (offset) => {
    const next = new Date(monthDate.getFullYear(), monthDate.getMonth() + offset, 1)
    setMonthDate(next)
    setSelectedDate(next)
  }

  const returnToday = () => {
    setSelectedDate(today)
    setMonthDate(new Date(today.getFullYear(), today.getMonth(), 1))
  }

  return (
    <section className="calendar-screen">
      <header className="calendar-header">
        <button className="calendar-back" type="button" onClick={onBack}>
          <ArrowLeft size={18} /> 内容
        </button>
        <img src={kuanxinLogo} alt="宽心纪" />
        <button className="calendar-today" type="button" onClick={returnToday}>今日</button>
      </header>

      <div className="calendar-shell">
        <div className="calendar-intro">
          <div className="calendar-intro__mark"><Leaf size={18} /> 顺时而行</div>
          <h1>四时日历</h1>
          <p>看见今日，也看见这一日所处的季节与传统时间。</p>
        </div>

        <div className="calendar-layout">
          <section className="month-panel" aria-label={`${monthDate.getFullYear()}年${monthDate.getMonth() + 1}月日历`}>
            <div className="month-toolbar">
              <button type="button" onClick={() => moveMonth(-1)} aria-label="上个月"><CaretLeft size={20} /></button>
              <div>
                <strong>{monthDate.getMonth() + 1}月</strong>
                <span>{monthDate.getFullYear()}</span>
              </div>
              <button type="button" onClick={() => moveMonth(1)} aria-label="下个月"><CaretRight size={20} /></button>
            </div>

            <div className="calendar-week" aria-hidden="true">
              {weekLabels.map((label) => <span key={label}>{label}</span>)}
            </div>

            <div className="calendar-grid">
              {monthDays.map((date) => {
                const dayData = dayLookup.get(dateKey(date))
                const inMonth = date.getMonth() === monthDate.getMonth()
                const isToday = sameDay(date, today)
                const selected = sameDay(date, selectedDate)
                return (
                  <button
                    className={[
                      'calendar-day',
                      !inMonth && 'calendar-day--muted',
                      isToday && 'calendar-day--today',
                      selected && 'calendar-day--selected',
                      dayData.solarTerm && 'calendar-day--term',
                    ].filter(Boolean).join(' ')}
                    key={dateKey(date)}
                    type="button"
                    onClick={() => {
                      setSelectedDate(date)
                      if (!inMonth) setMonthDate(new Date(date.getFullYear(), date.getMonth(), 1))
                    }}
                    aria-pressed={selected}
                    aria-label={`${formatDate(date)}，农历${dayData.lunarMonth}${dayData.lunarDay}${dayData.solarTerm ? `，${dayData.solarTerm}` : ''}`}
                  >
                    <span className="calendar-day__number">{date.getDate()}</span>
                    <span className="calendar-day__lunar">{dayData.solarTerm || (dayData.lunarDay === '初一' ? dayData.lunarMonth : dayData.lunarDay)}</span>
                  </button>
                )
              })}
            </div>
          </section>

          <aside className="day-panel" aria-live="polite">
            <div className="day-heading">
              <div className="day-heading__date">
                <span>{weekLabels[selectedDate.getDay()] === '日' ? '星期日' : `星期${weekLabels[selectedDate.getDay()]}`}</span>
                <strong>{selectedDate.getDate()}</strong>
              </div>
              <div>
                <p>{formatDate(selectedDate)}</p>
                <h2>农历{selectedData.lunarMonth}{selectedData.lunarDay}</h2>
                <span>{selectedData.yearGanZhi}年 · 属{selectedData.zodiac} · {selectedData.dayGanZhi}日</span>
              </div>
            </div>

            <section className="solar-term-focus">
              <div className="solar-term-focus__icon"><CalendarBlank size={23} weight="light" /></div>
              <div>
                <span>{selectedData.solarTerm ? '今日节气' : '下一节气'}</span>
                <h3>{activeTermName}</h3>
                <p>{solarTermNotes[activeTermName]}</p>
                {!selectedData.solarTerm && (
                  <small>
                    {selectedData.nextTerm.date.getMonth() + 1}月{selectedData.nextTerm.date.getDate()}日
                    {' · '}{daysUntilTerm}天后
                  </small>
                )}
              </div>
            </section>

            <div className="tradition-lists">
              <TraditionList title="宜" items={selectedData.yi} tone="yi" />
              <TraditionList title="忌" items={selectedData.ji} tone="ji" />
            </div>

            <div className="day-meta">
              <span>冲 {selectedData.clash}</span>
              <span>煞 {selectedData.sha}</span>
            </div>

            <p className="calendar-disclaimer">
              农历、节气与宜忌属于传统历法和民俗文化资料，仅供阅读参考，不作为婚嫁、医疗、投资或其他现实决策依据。
            </p>
          </aside>
        </div>
      </div>
    </section>
  )
}

export default SolarTermCalendar
