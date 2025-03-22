namespace HealthCRM.API.Utilities {
    public class DateTimeUtilities {
        public static DateTime RoundToNearest30Minutes(DateTime dateTime) {
            return new DateTime(dateTime.Year, 
            dateTime.Month, 
            dateTime.Day, 
            dateTime.Hour, 
            dateTime.Minute >= 30 ? 30 : 0, 0);
        }
    }
}