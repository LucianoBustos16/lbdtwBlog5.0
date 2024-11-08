// Format the date to a string
function formatDate(dateString: string | number | Date): string {
    const options: Intl.DateTimeFormatOptions = {year: 'numeric', month: 'short', day: 'numeric'};
  
    return new Date(dateString).toLocaleDateString(undefined, options);
  }
  // Capitalize the first letter
function capitalize(str:string): string {
  if ( typeof str !== 'string' || str.length === 0 ) {
    return str;
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

  export { formatDate, capitalize };
