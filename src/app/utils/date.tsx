import dayjs from 'dayjs'
import isToday from 'dayjs/plugin/isToday'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(isToday)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault('America/Argentina/Buenos_Aires')

export { dayjs }
