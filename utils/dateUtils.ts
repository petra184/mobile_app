/**
 * Format a date according to the specified format string
 * @param date The date to format
 * @param format The format string (e.g., 'MMM d', 'h:mm a')
 * @returns The formatted date string
 */
export function formatDate(date: Date, format: string): string {
    // Simple format implementation
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Get date components
    const month = months[date.getMonth()];
    const day = date.getDate();
    const dayOfWeek = days[date.getDay()];
    const year = date.getFullYear();
    
    // Get time components
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    
    // Replace format tokens
    return format
      .replace('MMM', month)
      .replace('MM', (date.getMonth() + 1).toString().padStart(2, '0'))
      .replace('M', (date.getMonth() + 1).toString())
      .replace('dd', day.toString().padStart(2, '0'))
      .replace('d', day.toString())
      .replace('yyyy', year.toString())
      .replace('yy', year.toString().slice(-2))
      .replace('EEE', dayOfWeek)
      .replace('h', hours.toString())
      .replace('mm', minutes)
      .replace('a', ampm);
  }
  
  /**
   * Format a time string (e.g., "14:30:00") to a more readable format (e.g., "2:30 PM")
   * @param timeString Time string in 24-hour format (HH:MM:SS)
   * @returns Formatted time string
   */
  export function formatTimeString(timeString: string | null): string {
    if (!timeString) return '';
    
    const [hourStr, minuteStr] = timeString.split(':');
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    
    hour = hour % 12;
    hour = hour ? hour : 12; // Convert 0 to 12
    
    return `${hour}:${minute.toString().padStart(2, '0')} ${ampm}`;
  }
  
  /**
   * Get relative time description (e.g., "Today", "Tomorrow", "In 3 days")
   * @param date The date to check
   * @returns Relative time description
   */
  export function getRelativeTimeDescription(date: Date): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (targetDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (targetDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      const diffTime = targetDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0 && diffDays < 7) {
        return `In ${diffDays} days`;
      } else {
        return formatDate(date, 'MMM d');
      }
    }
  }