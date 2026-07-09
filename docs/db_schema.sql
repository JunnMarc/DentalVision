-- DentalVision SQL Server Database Schema Definition
-- Created for DentalVision: Dental Clinic Management with Automated Plaque Mapping

CREATE DATABASE DentalVision;
GO

USE DentalVision;
GO

-- 1. Roles Table
CREATE TABLE Roles (
    RoleID INT IDENTITY(1,1) PRIMARY KEY,
    RoleName NVARCHAR(50) NOT NULL UNIQUE
);

-- 2. Users Table
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Email NVARCHAR(256) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(512) NOT NULL,
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    RoleID INT NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Users_Roles FOREIGN KEY (RoleID) REFERENCES Roles(RoleID)
);

-- 3. Dentists Table
CREATE TABLE Dentists (
    DentistID INT PRIMARY KEY, -- 1:1 relationship with Users
    LicenseNumber NVARCHAR(100) NOT NULL UNIQUE,
    Specialization NVARCHAR(200) NULL,
    CONSTRAINT FK_Dentists_Users FOREIGN KEY (DentistID) REFERENCES Users(UserID) ON DELETE CASCADE
);

-- 4. Receptionists Table
CREATE TABLE Receptionists (
    ReceptionistID INT PRIMARY KEY, -- 1:1 relationship with Users
    EmployeeCode NVARCHAR(50) NOT NULL UNIQUE,
    CONSTRAINT FK_Receptionists_Users FOREIGN KEY (ReceptionistID) REFERENCES Users(UserID) ON DELETE CASCADE
);

-- 5. Patients Table
CREATE TABLE Patients (
    PatientID INT IDENTITY(1,1) PRIMARY KEY,
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    DateOfBirth DATE NOT NULL,
    Gender NVARCHAR(20) NULL,
    Phone NVARCHAR(50) NOT NULL,
    Email NVARCHAR(256) NULL,
    Address NVARCHAR(500) NULL,
    MedicalHistory NVARCHAR(MAX) NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
);

-- 6. Appointments Table
CREATE TABLE Appointments (
    AppointmentID INT IDENTITY(1,1) PRIMARY KEY,
    PatientID INT NOT NULL,
    DentistID INT NOT NULL,
    AppointmentDate DATETIME NOT NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'Scheduled', -- Scheduled, Completed, Cancelled, NoShow
    Reason NVARCHAR(250) NULL,
    Notes NVARCHAR(MAX) NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Appointments_Patients FOREIGN KEY (PatientID) REFERENCES Patients(PatientID),
    CONSTRAINT FK_Appointments_Dentists FOREIGN KEY (DentistID) REFERENCES Dentists(DentistID)
);

-- 7. Invoices Table
CREATE TABLE Invoices (
    InvoiceID INT IDENTITY(1,1) PRIMARY KEY,
    PatientID INT NOT NULL,
    AppointmentID INT NULL,
    InvoiceDate DATETIME NOT NULL DEFAULT GETDATE(),
    TotalAmount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    DiscountAmount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    TaxAmount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    GrandTotal DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    BalanceDue DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    PaymentStatus NVARCHAR(50) NOT NULL DEFAULT 'Unpaid', -- Unpaid, PartiallyPaid, Paid
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Invoices_Patients FOREIGN KEY (PatientID) REFERENCES Patients(PatientID),
    CONSTRAINT FK_Invoices_Appointments FOREIGN KEY (AppointmentID) REFERENCES Appointments(AppointmentID) ON DELETE SET NULL
);

-- 8. InvoiceItems Table
CREATE TABLE InvoiceItems (
    InvoiceItemID INT IDENTITY(1,1) PRIMARY KEY,
    InvoiceID INT NOT NULL,
    Description NVARCHAR(250) NOT NULL,
    UnitPrice DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    Quantity INT NOT NULL DEFAULT 1,
    LineTotal DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    CONSTRAINT FK_InvoiceItems_Invoices FOREIGN KEY (InvoiceID) REFERENCES Invoices(InvoiceID) ON DELETE CASCADE
);

-- 9. Payments Table
CREATE TABLE Payments (
    PaymentID INT IDENTITY(1,1) PRIMARY KEY,
    InvoiceID INT NOT NULL,
    PaymentDate DATETIME NOT NULL DEFAULT GETDATE(),
    AmountPaid DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    PaymentMethod NVARCHAR(50) NOT NULL, -- Cash, Card, Insurance, BankTransfer
    TransactionReference NVARCHAR(100) NULL,
    Notes NVARCHAR(MAX) NULL,
    CONSTRAINT FK_Payments_Invoices FOREIGN KEY (InvoiceID) REFERENCES Invoices(InvoiceID) ON DELETE CASCADE
);

-- 10. DentalImages Table
CREATE TABLE DentalImages (
    ImageID INT IDENTITY(1,1) PRIMARY KEY,
    PatientID INT NOT NULL,
    UploadedByUserID INT NOT NULL,
    FilePath NVARCHAR(500) NOT NULL,
    UploadedAt DATETIME NOT NULL DEFAULT GETDATE(),
    Notes NVARCHAR(MAX) NULL,
    CONSTRAINT FK_DentalImages_Patients FOREIGN KEY (PatientID) REFERENCES Patients(PatientID),
    CONSTRAINT FK_DentalImages_Users FOREIGN KEY (UploadedByUserID) REFERENCES Users(UserID)
);

-- 11. PlaqueAnalyses Table
CREATE TABLE PlaqueAnalyses (
    AnalysisID INT IDENTITY(1,1) PRIMARY KEY,
    ImageID INT NOT NULL UNIQUE, -- 1:1 relationship with DentalImages
    CoveragePercentage DECIMAL(5,2) NOT NULL,
    ConfidenceScore DECIMAL(3,2) NOT NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'PendingValidation', -- PendingValidation, Approved, Edited
    DetectedRegions NVARCHAR(MAX) NULL, -- JSON string containing regions of interests
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    ApprovedByDentistID INT NULL,
    ApprovedAt DATETIME NULL,
    CONSTRAINT FK_PlaqueAnalyses_DentalImages FOREIGN KEY (ImageID) REFERENCES DentalImages(ImageID) ON DELETE CASCADE,
    CONSTRAINT FK_PlaqueAnalyses_Dentists FOREIGN KEY (ApprovedByDentistID) REFERENCES Dentists(DentistID)
);

-- 12. PlaqueMappings Table
CREATE TABLE PlaqueMappings (
    MappingID INT IDENTITY(1,1) PRIMARY KEY,
    AnalysisID INT NOT NULL,
    ToothNumber INT NOT NULL,
    PlaqueLevel NVARCHAR(20) NOT NULL, -- Low, Medium, High
    GumlineRegion NVARCHAR(50) NOT NULL, -- Cervical, Interproximal, Margin
    CoordinatesJson NVARCHAR(MAX) NOT NULL, -- Node points for visual canvas
    CONSTRAINT FK_PlaqueMappings_PlaqueAnalyses FOREIGN KEY (AnalysisID) REFERENCES PlaqueAnalyses(AnalysisID) ON DELETE CASCADE
);

-- 13. ClinicalReports Table
CREATE TABLE ClinicalReports (
    ReportID INT IDENTITY(1,1) PRIMARY KEY,
    PatientID INT NOT NULL,
    DentistID INT NOT NULL,
    AnalysisID INT NOT NULL UNIQUE, -- 1:1 with PlaqueAnalyses
    ReportDate DATETIME NOT NULL DEFAULT GETDATE(),
    DentistNotes NVARCHAR(MAX) NULL,
    Recommendations NVARCHAR(MAX) NULL,
    ApprovalStatus NVARCHAR(50) NOT NULL DEFAULT 'Draft', -- Draft, Approved
    PdfFilePath NVARCHAR(500) NULL,
    CONSTRAINT FK_ClinicalReports_Patients FOREIGN KEY (PatientID) REFERENCES Patients(PatientID),
    CONSTRAINT FK_ClinicalReports_Dentists FOREIGN KEY (DentistID) REFERENCES Dentists(DentistID),
    CONSTRAINT FK_ClinicalReports_PlaqueAnalyses FOREIGN KEY (AnalysisID) REFERENCES PlaqueAnalyses(AnalysisID)
);

-- 14. AuditLogs Table
CREATE TABLE AuditLogs (
    AuditLogID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NULL,
    Action NVARCHAR(100) NOT NULL,
    TableName NVARCHAR(100) NOT NULL,
    RecordID INT NULL,
    OldValues NVARCHAR(MAX) NULL,
    NewValues NVARCHAR(MAX) NULL,
    Timestamp DATETIME NOT NULL DEFAULT GETDATE(),
    IPAddress NVARCHAR(50) NULL,
    CONSTRAINT FK_AuditLogs_Users FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE SET NULL
);

-- 15. Notifications Table
CREATE TABLE Notifications (
    NotificationID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    Title NVARCHAR(200) NOT NULL,
    Message NVARCHAR(MAX) NOT NULL,
    IsRead BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Notifications_Users FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

-- 16. ClinicSettings Table
CREATE TABLE ClinicSettings (
    SettingID INT IDENTITY(1,1) PRIMARY KEY,
    SettingKey NVARCHAR(100) NOT NULL UNIQUE,
    SettingValue NVARCHAR(MAX) NOT NULL,
    Description NVARCHAR(250) NULL
);

-- Performance Indexes
CREATE INDEX IX_Users_Email ON Users(Email);
CREATE INDEX IX_Patients_LastName_FirstName ON Patients(LastName, FirstName);
CREATE INDEX IX_Appointments_Date ON Appointments(AppointmentDate);
CREATE INDEX IX_Invoices_PatientID ON Invoices(PatientID);
CREATE INDEX IX_Payments_InvoiceID ON Payments(InvoiceID);
CREATE INDEX IX_DentalImages_PatientID ON DentalImages(PatientID);
CREATE INDEX IX_PlaqueAnalyses_ImageID ON PlaqueAnalyses(ImageID);
CREATE INDEX IX_PlaqueMappings_AnalysisID ON PlaqueMappings(AnalysisID);
CREATE INDEX IX_ClinicalReports_PatientID ON ClinicalReports(PatientID);
CREATE INDEX IX_AuditLogs_Timestamp ON AuditLogs(Timestamp);
GO
