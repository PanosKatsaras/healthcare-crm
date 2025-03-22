using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using HealthCRM.API.Models;
using System;

namespace HealthCRM.API.Data
{
    public class AppDbContext : IdentityDbContext<ApplicationUser>
    {
        // Constructor to pass DbContext options to the base class
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        // DbSet properties for each entity in the database
        public DbSet<ApplicationUser> ApplicationUsers { get; set; }
        public DbSet<Patient> Patients { get; set; }
        public DbSet<Doctor> Doctors { get; set; }
        public DbSet<Appointment> Appointments { get; set; }
        public DbSet<Examination> Examinations { get; set; }
        public DbSet<MedicalRecord> MedicalRecords { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            // Call base configuration for Identity tables
            base.OnModelCreating(builder);

            // Seed default roles
            builder.Entity<IdentityRole>().HasData(
                new IdentityRole
                {
                    Id = "1",
                    Name = "Admin",
                    NormalizedName = "ADMIN",
                    ConcurrencyStamp = Guid.NewGuid().ToString()
                },
                new IdentityRole
                {
                    Id = "2",
                    Name = "Manager",
                    NormalizedName = "MANAGER",
                    ConcurrencyStamp = Guid.NewGuid().ToString()
                },
                new IdentityRole
                {
                    Id = "3",
                    Name = "Doctor",
                    NormalizedName = "DOCTOR",
                    ConcurrencyStamp = Guid.NewGuid().ToString()
                },
                new IdentityRole
                {
                    Id = "4",
                    Name = "Staff",
                    NormalizedName = "STAFF",
                    ConcurrencyStamp = Guid.NewGuid().ToString()
                }
            );

            // Doctor entity
            builder.Entity<Doctor>()
                .HasIndex(d => d.AMKA)
                .IsUnique();  // Ensure ΑΜΚΑ is unique for doctors

            builder.Entity<Doctor>()
                .HasIndex(d => d.Email)
                .IsUnique();  // Ensure email is unique for doctors

            builder.Entity<Doctor>()
                .HasIndex(d => new { d.FullName, d.Specialization }); // Add index for doctor Full Name and Specialization

            // Doctor-Patient relationship
            builder.Entity<Doctor>()
                .HasMany(d => d.Patients)
                .WithOne(p => p.Doctor)
                .HasForeignKey(p => p.DoctorId)
                .OnDelete(DeleteBehavior.NoAction); // Do not delete the doctor if the patient is deleted

            // Doctor-MedicalRecord relationship
            builder.Entity<Doctor>()
                .HasMany(d => d.MedicalRecords)
                .WithOne(p => p.Doctor)
                .HasForeignKey(p => p.DoctorId)
                .OnDelete(DeleteBehavior.Restrict); // Do not delete the doctor if the medical record is deleted

            // Patient entity
            builder.Entity<Patient>()
                .HasIndex(p => p.ΑΜΚΑ)
                .IsUnique();  // Ensure ΑΜΚΑ is unique for patient

            builder.Entity<Patient>()
                .HasIndex(p => p.Email)
                .IsUnique();  // Ensure email is unique for patient

            builder.Entity<Patient>()
                .HasIndex(p => p.FullName); // Add index for patient full name

            builder.Entity<Patient>()
                .HasOne(p => p.Doctor)
                .WithMany(d => d.Patients)
                .IsRequired(true)  // Patient must have a doctor
                .HasForeignKey(p => p.DoctorId) // Define the foreign key explicitly
                .OnDelete(DeleteBehavior.Restrict); // Do not delete the doctor if the patient is deleted

            builder.Entity<Patient>()
                .HasOne(p => p.MedicalRecord) // Patient-MedicalRecord relationship
                .WithOne(m => m.Patient) // One patient has one medical record
                .HasForeignKey<MedicalRecord>(m => m.PatientId) // Define the foreign key explicitly
                .IsRequired(false)  // Allow patient without medical record initially
                .OnDelete(DeleteBehavior.SetNull);  // Set the MedicalRecordId to Guid.Empty if the MedicalRecord is deleted

            // Appointment entity
            builder.Entity<Appointment>()
                .HasOne(a => a.Patient)
                .WithMany()
                .HasForeignKey(a => a.PatientId)
                .IsRequired(false)  // Allow appointment without patient
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Appointment>()
                .HasOne(a => a.Doctor)
                .WithMany()
                .HasForeignKey(a => a.DoctorId)
                .IsRequired(false)  // Allow appointment without doctor
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Appointment>()
                .HasOne(a => a.Examination)
                .WithOne()
                .HasForeignKey<Appointment>(a => a.ExaminationId)
                .IsRequired(false)  // Allow appointment without examination initially
                .OnDelete(DeleteBehavior.Cascade);  // Delete the examination if the appointment is deleted

            // Ensure one examination can only be linked to one appointment
            builder.Entity<Appointment>()
                .HasIndex(a => a.ExaminationId)
                .IsUnique()
                .HasFilter("[ExaminationId] IS NOT NULL");

            // Add performance indexes for Appointment
            builder.Entity<Appointment>()
                .HasIndex(a => a.AppointmentDate);

            builder.Entity<Appointment>()
                .HasIndex(a => a.Status);

            // MedicalRecord entity
            builder.Entity<MedicalRecord>()
                .HasOne(m => m.Patient)
                .WithOne(p => p.MedicalRecord)  // One patient has one medical record
                .HasForeignKey<MedicalRecord>(m => m.PatientId)
                .IsRequired()  // Medical record must have a patient
                .OnDelete(DeleteBehavior.Restrict);  // Do not delete the patient if the medical record is deleted

            builder.Entity<MedicalRecord>()
                .HasOne(m => m.Doctor)
                .WithMany(d => d.MedicalRecords)  // One doctor can have many medical records
                .HasForeignKey(m => m.DoctorId)
                .IsRequired()  // Medical record must have a doctor
                .OnDelete(DeleteBehavior.Restrict);  // Do not delete the doctor if the medical record is deleted

            // Ensure one medical record per patient
            builder.Entity<MedicalRecord>()
                .HasIndex(m => m.PatientId)
                .IsUnique();

            // Examination entity
            builder.Entity<Examination>()
                .HasOne(e => e.Patient)
                .WithMany()
                .HasForeignKey(e => e.PatientId)
                .IsRequired(false)  // Allow examination without patient
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Examination>()
                .HasOne(e => e.Doctor)
                .WithMany()
                .HasForeignKey(e => e.DoctorId)
                .IsRequired(false)  // Allow examination without doctor
                .OnDelete(DeleteBehavior.Restrict);

        }
    }
}