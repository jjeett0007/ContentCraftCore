import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

const WelcomeCard: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Welcome to Corebase CMS</h2>
          <p className="mt-1 text-gray-600">Build and manage content types easily with our powerful admin interface.</p>
        </div>
        {isAdmin ? (
          <Link href="/content-type-builder">
            <Button className="px-4 py-2 bg-primary text-dark font-medium rounded-md hover:bg-primary/90 transition-colors">
              Get Started
            </Button>
          </Link>
        ) : (
          <Button className="px-4 py-2 bg-primary text-dark font-medium rounded-md hover:bg-primary/90 transition-colors" disabled>
            Get Started
          </Button>
        )}
      </div>
    </div>
  );
};

export default WelcomeCard;
