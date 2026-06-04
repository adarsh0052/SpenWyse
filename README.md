# 💸 SpenWyse

> Spend smarter. Save intentionally.

SpenWyse is a modern personal finance management application built with **React Native, Expo, Supabase, and PostgreSQL** that helps users track expenses, manage recurring commitments, control discretionary spending, and stay aligned with their financial goals.

---

## ✨ Features

### 🔐 Authentication

* Google OAuth Login
* Email & Password Authentication
* Persistent Sessions
* Secure Logout

### 💰 Expense Management

* Add Expenses
* Categorized Tracking
* Recurring Expense Support
* Real-time Spending Updates

### 🎯 Smart Allocation System

* Allocate money to future goals
* Release allocations back into spendable funds
* Flexible Pool calculations
* Dynamic Daily Spend Limits

### 📊 Analytics Dashboard

* Spending Heatmap
* Category Breakdown
* Spending Streak Tracking
* Monthly Insights
* Financial Health Overview

### 🎉 Monthly Lifecycle

* Automatic Month-End Processing
* Snapshot Generation
* Reward Screen
* Fresh Month Initialization

---

## 🏗️ Tech Stack

### Frontend

* React Native
* Expo Router
* TypeScript

### Backend

* Supabase
* PostgreSQL

### Authentication

* Supabase Auth
* Google OAuth

### Database

* Profiles
* Expenses
* Allocations
* Monthly Snapshots

---

## 🧠 Core Finance Engine

All financial calculations are centralized inside:

```text
services/finance.ts
```

This ensures a single source of truth across:

* Dashboard
* Analytics
* Allocations
* Reward System

### Calculated Metrics

* Flexible Pool
* Daily Spend Limit
* Remaining Days
* Allocation Impact
* Monthly Savings

---

## 📱 User Flow

```text
Launch App
    │
    ▼
 Onboarding
    │
    ▼
 Authentication
 ┌─────────────┐
 │ Google OAuth│
 │ Email Login │
 │ Email Signup│
 └─────────────┘
    │
    ▼
 User Type
    │
    ▼
 Income Setup
    │
    ▼
 Dashboard
    │
 ┌──┼───────────┐
 ▼  ▼           ▼
Expenses Analytics Profile
 │
 ▼
Allocations
 │
 ▼
Monthly Processing
 │
 ▼
Reward Screen
 │
 ▼
New Month
```



### Profiles

Stores:

* User Information
* Monthly Income
* Current Month Spend
* Reward State
* Onboarding Status

### Expenses

Stores:

* Amount
* Category
* Date
* Recurring Status

### Allocations

Stores:

* Goal Name
* Amount Locked
* Release Information

### Monthly Snapshots

Stores:

* Income
* Spending
* Savings
* Category Statistics
* Monthly Streaks

---

## 🚀 Future Roadmap

* Previous Month Analytics
* Push Notifications
* Email Verification
* Forgot Password
* Budget Forecasting
* Financial Goal Tracking

---


