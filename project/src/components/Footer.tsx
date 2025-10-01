import React from 'react';

export function Footer() {
  return (
    <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-t border-gray-800/50 mt-16 sm:mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
          <div>
            <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent">
              About NewsHub
            </h3>
            <p className="text-gray-400 leading-relaxed text-sm sm:text-base">
              Your personalized news platform bringing you the latest stories from around the world.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent">
              Quick Links
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm sm:text-base">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm sm:text-base">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm sm:text-base">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent">
              Connect With Us
            </h3>
            <p className="text-gray-400 leading-relaxed text-sm sm:text-base">
              Follow us on social media for the latest updates and breaking news.
            </p>
          </div>
        </div>
        <div className="border-t border-gray-800/50 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-gray-400 text-sm">
          <p>&copy; 2024 NewsHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}