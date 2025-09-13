'use client';

import React from 'react';
import { Heart, MessageCircle, Calendar, Star, Users } from 'lucide-react';

export default function NutritionConsultant() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-200 via-teal-200 to-emerald-200 pb-20">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Nutrition Consultant</h1>
          <p className="text-gray-600">Get personalized nutrition advice from certified professionals</p>
        </div>

        {/* Coming Soon Banner */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="text-white" size={24} />
            <h2 className="text-xl font-semibold">Coming Soon!</h2>
          </div>
          <p className="text-indigo-100 mb-4">
            We're working on connecting you with certified nutritionists and dietitians 
            who can provide personalized meal planning and nutritional guidance.
          </p>
          <div className="flex items-center gap-2 text-sm text-indigo-200">
            <Calendar size={16} />
            <span>Expected launch: Q2 2024</span>
          </div>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3 mb-3">
              <MessageCircle className="text-indigo-600" size={20} />
              <h3 className="font-semibold text-gray-800">1-on-1 Consultations</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Schedule private video calls with certified nutritionists for personalized advice.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3 mb-3">
              <Star className="text-indigo-600" size={20} />
              <h3 className="font-semibold text-gray-800">Custom Meal Plans</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Get professionally designed meal plans tailored to your specific dietary needs and goals.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3 mb-3">
              <Users className="text-indigo-600" size={20} />
              <h3 className="font-semibold text-gray-800">Group Sessions</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Join group nutrition workshops and cooking classes with other health-conscious individuals.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3 mb-3">
              <Heart className="text-indigo-600" size={20} />
              <h3 className="font-semibold text-gray-800">Health Monitoring</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Track your progress with regular check-ins and personalized health assessments.
            </p>
          </div>
        </div>

        {/* Waitlist Signup */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Join the Waitlist</h3>
          <p className="text-gray-600 mb-4">
            Be the first to know when our nutrition consultant service launches. 
            Early members will receive exclusive discounts and priority access.
          </p>
          
          <div className="flex gap-3">
            <input
              type="email"
              placeholder="Enter your email address"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium">
              Join Waitlist
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            We'll never spam you. Unsubscribe at any time.
          </p>
        </div>

        {/* FAQ Preview */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Frequently Asked Questions</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">What qualifications do the nutritionists have?</h4>
              <p className="text-gray-600 text-sm">
                All our nutritionists are certified professionals with degrees in nutrition, dietetics, 
                or related fields, and are licensed to practice in their respective regions.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">How much will consultations cost?</h4>
              <p className="text-gray-600 text-sm">
                Pricing will vary based on the type of consultation and duration. 
                We're committed to making professional nutrition advice accessible and affordable.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Can I get meal plans for specific dietary restrictions?</h4>
              <p className="text-gray-600 text-sm">
                Absolutely! Our nutritionists specialize in various dietary approaches including 
                vegetarian, vegan, keto, paleo, gluten-free, and many others.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
