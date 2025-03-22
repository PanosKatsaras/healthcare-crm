namespace HealthCRM.API.Utilities
{
    public enum ExamType
    {
        BloodTest = 1,
        XRay = 2,
        MRI = 3,
        Ultrasound = 4,
        Endoscopy = 5,
        Spirometry = 6,
        Electrocardiogram = 7,
        BoneDensityScan = 8,
        GlucoseToleranceTest = 9,
        ThyroidFunctionTest = 10
    }

    public enum ExamStatus
    {
    Pending = 1,
    Scheduled = 2,
    Completed = 3
    }
}