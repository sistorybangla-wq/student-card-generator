import { CardConfig, CardType, FormFieldType } from '@/types/card';

export const cardConfig: CardConfig = {
  defaultCardType: CardType.BABU_BANARASI_DAS,
  templates: {
    [CardType.BABU_BANARASI_DAS]: {
      id: CardType.BABU_BANARASI_DAS,
      name: 'Babu Banarasi Das University',
      description: 'Student ID Card for Babu Banarasi Das University',
      demoImagePath: '/img/demo/card1.png',
      templateImagePath: '/img/phoi/card1.png',
      dimensions: {
        width: 800,
        height: 500
      },
      university: {
        name: 'Babu Banarasi Das University',
        code: 'BBDU'
      },
      formFields: [
        {
          id: 'school',
          label: 'School/University',
          type: FormFieldType.TEXT,
          placeholder: 'University name',
          required: true,
          defaultValue: 'Babu Banarasi Das University',
          readonly: true,
          validation: {
            minLength: 2,
            maxLength: 100
          }
        },
        {
          id: 'name',
          label: "Student's Name",
          type: FormFieldType.TEXT,
          placeholder: "Enter student's full name",
          required: true,
          validation: {
            minLength: 2,
            maxLength: 50
          }
        },
        {
          id: 'fatherName',
          label: "Father's Name",
          type: FormFieldType.TEXT,
          placeholder: "Enter father's full name",
          required: true,
          validation: {
            minLength: 2,
            maxLength: 50
          }
        },
        {
          id: 'mobileNumber',
          label: 'Mobile No.',
          type: FormFieldType.TEL,
          placeholder: '+91 XXXXXXXXXX or +91XXXXXXXXXX',
          required: true,
          validation: {
            pattern: '^\\+91\\s?[6-9]\\d{9}$',
            minLength: 13,
            maxLength: 14
          }
        },
        {
          id: 'batchYear',
          label: 'Batch',
          type: FormFieldType.SELECT,
          required: true,
          options: [
            { value: '2020-2024', label: '2020-2024' },
            { value: '2021-2025', label: '2021-2025' },
            { value: '2022-2026', label: '2022-2026' },
            { value: '2023-2027', label: '2023-2027' },
            { value: '2024-2028', label: '2024-2028' },
            { value: '2025-2029', label: '2025-2029' }
          ]
        },
        {
          id: 'photo',
          label: 'Student Photo',
          type: FormFieldType.FILE,
          required: false
        }
      ],
      textPositions: {
        name: {
          x: 215,
          y: 227,
          fontSize: 22,
          fontFamily: 'Times New Roman',
          fontWeight: 'normal',
          color: '#000000',
          maxWidth: 300,
          textAlign: 'left'
        },
        fatherName: {
          x: 215,
          y: 292,
          fontSize: 22,
          fontFamily: 'Times New Roman',
          fontWeight: 'normal',
          color: '#333333',
          maxWidth: 300,
          textAlign: 'left'
        },
        mobileNumber: {
          x: 215,
          y: 323,
          fontSize: 22,
          fontFamily: 'Times New Roman',
          fontWeight: 'normal',
          color: '#333333',
          maxWidth: 300,
          textAlign: 'left'
        },
        batchYear: {
          x: 215,
          y: 355,
          fontSize: 22,
          fontFamily: 'Times New Roman',
          fontWeight: 'normal',
          color: '#333333',
          maxWidth: 300,
          textAlign: 'left'
        }
      },
      photoPosition: {
        x: 600,
        y: 170,
        width: 180,
        height: 210,
        borderRadius: 8
      }
    },
    [CardType.IIT_MADRAS]: {
      id: CardType.IIT_MADRAS,
      name: 'Indian Institute of Technology Madras',
      description: 'Student ID Card for IIT Madras',
      demoImagePath: '/img/demo/card2.png',
      templateImagePath: '/img/phoi/card2.png',
      dimensions: {
        width: 800,
        height: 500
      },
      university: {
        name: 'Indian Institute of Technology Madras',
        code: 'IITM'
      },
      formFields: [
        {
          id: 'school',
          label: 'School/University',
          type: FormFieldType.TEXT,
          placeholder: 'University name',
          required: true,
          defaultValue: 'Indian Institute of Technology Madras',
          readonly: true,
          validation: {
            minLength: 2,
            maxLength: 100
          }
        },
        {
          id: 'name',
          label: 'Name',
          type: FormFieldType.TEXT,
          placeholder: "Enter student's full name",
          required: true,
          validation: {
            minLength: 2,
            maxLength: 50
          }
        },
        {
          id: 'dateOfBirth',
          label: 'Date of Birth',
          type: FormFieldType.DATE,
          required: true,
          validation: {
            max: new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 18 years ago
          }
        },
        {
          id: 'enrollmentNo',
          label: 'Enrollment No',
          type: FormFieldType.TEXT,
          placeholder: 'Enter enrollment number',
          required: true,
          validation: {
            pattern: '^[A-Z0-9]{8,12}$',
            minLength: 8,
            maxLength: 12
          }
        },
        {
          id: 'degree',
          label: 'Degree',
          type: FormFieldType.SELECT,
          required: true,
          options: [
            { value: 'B.Tech', label: 'Bachelor of Technology (B.Tech)' },
            { value: 'M.Tech', label: 'Master of Technology (M.Tech)' },
            { value: 'PhD', label: 'Doctor of Philosophy (PhD)' },
            { value: 'M.Sc', label: 'Master of Science (M.Sc)' },
            { value: 'B.Sc', label: 'Bachelor of Science (B.Sc)' },
            { value: 'MBA', label: 'Master of Business Administration (MBA)' },
            { value: 'MS', label: 'Master of Science (MS)' }
          ]
        },
        {
          id: 'department',
          label: 'Department',
          type: FormFieldType.SELECT,
          required: true,
          options: [
            { value: 'Computer Science & Engineering', label: 'Computer Science & Engineering' },
            { value: 'Electrical Engineering', label: 'Electrical Engineering' },
            { value: 'Mechanical Engineering', label: 'Mechanical Engineering' },
            { value: 'Civil Engineering', label: 'Civil Engineering' },
            { value: 'Chemical Engineering', label: 'Chemical Engineering' },
            { value: 'Aerospace Engineering', label: 'Aerospace Engineering' },
            { value: 'Biotechnology', label: 'Biotechnology' },
            { value: 'Mathematics', label: 'Mathematics' },
            { value: 'Physics', label: 'Physics' },
            { value: 'Chemistry', label: 'Chemistry' }
          ]
        },
        {
          id: 'address',
          label: 'Address',
          type: FormFieldType.TEXT,
          placeholder: 'Enter residential address',
          required: true,
          validation: {
            minLength: 10,
            maxLength: 200
          }
        },
        {
          id: 'dateOfIssue',
          label: 'Date of Issue',
          type: FormFieldType.DATE,
          required: true
        },
        {
          id: 'validUntil',
          label: 'Valid Until',
          type: FormFieldType.DATE,
          required: true
        },
        {
          id: 'photo',
          label: 'Student Photo',
          type: FormFieldType.FILE,
          required: false
        }
      ],
      textPositions: {
        name: {
          x: 330,
          y: 190,
          fontSize: 22,
          fontFamily: 'Times New Roman',
          fontWeight: 'bold',
          color: '#000000',
          maxWidth: 350,
          textAlign: 'left'
        },
        dateOfBirth: {
          x: 400,
          y: 218,
          fontSize: 22,
          fontFamily: 'Times New Roman',
          fontWeight: 'bold',
          color: '#333333',
          maxWidth: 350,
          textAlign: 'left'
        },
        enrollmentNo: {
          x: 420,
          y: 245,
          fontSize: 22,
          fontFamily: 'Times New Roman',
          fontWeight: 'bold',
          color: '#000000',
          maxWidth: 350,
          textAlign: 'left'
        },
        degree: {
          x: 350,
          y: 273,
          fontSize: 22,
          fontFamily: 'Times New Roman',
          fontWeight: 'bold',
          color: '#333333',
          maxWidth: 350,
          textAlign: 'left'
        },
        department: {
          x: 400,
          y: 300,
          fontSize: 22,
          fontFamily: 'Times New Roman',
          fontWeight: 'bold',
          color: '#333333',
          maxWidth: 450,
          textAlign: 'left'
        },
        address: {
          x: 360,
          y: 327,
          fontSize: 22,
          fontFamily: 'Times New Roman',
          fontWeight: 'bold',
          color: '#333333',
          maxWidth: 450,
          textAlign: 'left',
        },
        dateOfIssue: {
          x: 170,
          y: 410,
          fontSize: 16,
          fontFamily: 'Times New Roman',
          fontWeight: 'bold',
          color: 'blue',
          maxWidth: 150,
          textAlign: 'left'
        },
        validUntil: {
          x: 140,
          y: 428,
          fontSize: 16,
          fontFamily: 'Times New Roman',
          fontWeight: 'bold',
          color: 'blue',
          maxWidth: 150,
          textAlign: 'left'
        }
      },
      photoPosition: {
        x: 35,
        y: 120,
        width: 210,
        height: 275,
        borderRadius: 15
      }
    }
  }
};

// Helper function to get card template by type
export const getCardTemplate = (cardType: CardType) => {
  return cardConfig.templates[cardType];
};

// Helper function to get all available card types
export const getAvailableCardTypes = () => {
  return Object.values(CardType);
};

// Helper function to get default card template
export const getDefaultCardTemplate = () => {
  return cardConfig.templates[cardConfig.defaultCardType];
};
