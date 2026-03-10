import { useState } from "react";
import { LandingPage } from "./components/LandingPage";
import { UniversityPortal } from "./components/UniversityPortal";
import { UniversityStudentPortal } from "./components/UniversityStudentPortal";
import { UniversityDSOPortal } from "./components/UniversityDSOPortal";
import { UniversityChoice } from "./components/UniversityChoice";
import { StudentAuth } from "./components/StudentAuth";
import { DSOAuth } from "./components/DSOAuth";
import { AskLexiPage } from "./components/AskLexiPage";
import { RequestCenterPage } from "./components/RequestCenterPage";
import { IntegrationTest } from "./components/IntegrationTest";
import { QuickTest } from "./components/QuickTest";
import CleanupUtility from "./CleanupUtility";
import { Toaster } from 'sonner@2.0.3';

export default function App() {
  const [currentPage, setCurrentPage] =
    useState<string>("landing");
  const [userData, setUserData] = useState<any>(null);

  // Simple navigation context
  const navigate = (page: string) => setCurrentPage(page);

  // Handle user login - store user data
  const handleUserLogin = (user: any) => {
    setUserData(user);
  };

  const renderPage = () => {
    switch (currentPage) {
      case "landing":
        return <LandingPage onNavigate={navigate} />;
      case "quick-test":
        return <QuickTest onNavigate={navigate} />;
      case "integration-test":
        return (
          <IntegrationTest onBack={() => navigate("landing")} />
        );
      case "university-choice":
        return <UniversityChoice onNavigate={navigate} />;
      case "student-auth":
        return (
          <StudentAuth
            onNavigate={navigate}
            onLogin={handleUserLogin}
          />
        );
      case "dso-auth":
        return (
          <DSOAuth
            onNavigate={navigate}
            onLogin={handleUserLogin}
          />
        );
      case "student-portal":
        return (
          <UniversityStudentPortal
            onNavigate={navigate}
            onLogout={() => {
              setUserData(null);
              navigate("student-auth");
            }}
            userData={userData}
          />
        );
      case "dso-portal":
        return (
          <UniversityDSOPortal
            onNavigate={navigate}
            onLogout={() => {
              setUserData(null);
              navigate("dso-auth");
            }}
            userData={userData}
          />
        );
      case "university":
        return <UniversityPortal onNavigate={navigate} />;
      case "ask-lexi":
        return (
          <AskLexiPage
            onBack={() => navigate("student-portal")}
            userName={
              userData?.data?.user?.user_metadata?.name ||
              "Student"
            }
          />
        );
      case "request-center":
        return (
          <RequestCenterPage
            onNavigate={navigate}
            onSubmit={(data) =>
              console.log("Request submitted:", data)
            }
          />
        );
      case "cleanup-utility":
        return <CleanupUtility />;
      default:
        return <LandingPage onNavigate={navigate} />;
    }
  };

  return <>{renderPage()}<Toaster position="top-right" richColors /></>;
}