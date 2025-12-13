/**
 * UI Component Examples
 *
 * This file demonstrates how to use all the UI components from the design system.
 * Use this as a reference when implementing features.
 */

import React from 'react';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Badge,
  ProgressBar,
} from './index';

/**
 * Example: Button Component Usage
 */
export function ButtonExamples() {
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Button Examples</h2>

      {/* Variants */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Variants</h3>
        <div className="flex gap-4 flex-wrap">
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="danger">Danger Button</Button>
        </div>
      </div>

      {/* Sizes */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Sizes</h3>
        <div className="flex gap-4 items-center flex-wrap">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </div>

      {/* States */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">States</h3>
        <div className="flex gap-4 flex-wrap">
          <Button>Normal</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>
      </div>

      {/* With Icons */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">With Icons</h3>
        <div className="flex gap-4 flex-wrap">
          <Button
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Add Goal
          </Button>
          <Button
            rightIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            }
          >
            Next
          </Button>
        </div>
      </div>

      {/* Full Width */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Full Width</h3>
        <Button fullWidth>Full Width Button</Button>
      </div>
    </div>
  );
}

/**
 * Example: Input Component Usage
 */
export function InputExamples() {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [amount, setAmount] = React.useState('');

  return (
    <div className="space-y-6 p-6 max-w-2xl">
      <h2 className="text-2xl font-bold">Input Examples</h2>

      {/* Basic Input */}
      <Input
        label="Goal Name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g., Retirement 2045"
        required
      />

      {/* With Helper Text */}
      <Input
        label="Email Address"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        helperText="We'll never share your email with anyone else."
        placeholder="you@example.com"
      />

      {/* With Error */}
      <Input
        label="Target Amount"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        error={amount && Number(amount) < 0 ? 'Amount must be positive' : undefined}
        placeholder="1500000"
      />

      {/* With Left Icon */}
      <Input
        label="Monthly Contribution"
        type="number"
        placeholder="2500"
        leftIcon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />

      {/* Date Input */}
      <Input
        label="Target Date"
        type="date"
        helperText="When do you want to achieve this goal?"
        required
      />

      {/* Disabled State */}
      <Input
        label="Calculated Value"
        type="text"
        value="$1,620,000"
        disabled
        helperText="This value is automatically calculated"
      />
    </div>
  );
}

/**
 * Example: Card Component Usage
 */
export function CardExamples() {
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Card Examples</h2>

      {/* Default Card */}
      <Card>
        <CardHeader title="Simple Card" subtitle="This is a basic card with default styling" />
        <CardContent>
          <p className="text-gray-600">Card content goes here. This can contain any React elements.</p>
        </CardContent>
      </Card>

      {/* Card with Badge and Actions */}
      <Card hoverable>
        <CardHeader
          title="Retirement 2045"
          subtitle="Retire comfortably at age 65 with $80K/year income"
          badge={<Badge variant="error" size="sm">Essential</Badge>}
          action={
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          }
        />
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Current</span>
              <span className="font-mono font-semibold text-gray-900">$1,200,000</span>
            </div>
            <ProgressBar value={80} showPercentage color="success" />
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Target</span>
              <span className="font-mono font-semibold text-gray-900">$1,500,000</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="secondary" size="sm">View Details</Button>
          <Button variant="ghost" size="sm">Edit</Button>
        </CardFooter>
      </Card>

      {/* Elevated Card */}
      <Card variant="elevated" padding="lg">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Elevated Card</h3>
        <p className="text-gray-600">This card has a larger shadow for more prominence.</p>
      </Card>

      {/* Flat Card */}
      <Card variant="flat" padding="sm">
        <p className="text-sm text-gray-600">Flat card with minimal elevation</p>
      </Card>
    </div>
  );
}

/**
 * Example: Badge Component Usage
 */
export function BadgeExamples() {
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Badge Examples</h2>

      {/* Variants */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Variants</h3>
        <div className="flex gap-3 flex-wrap">
          <Badge variant="primary">Primary</Badge>
          <Badge variant="success">On Track</Badge>
          <Badge variant="warning">Behind</Badge>
          <Badge variant="error">At Risk</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="neutral">Archived</Badge>
        </div>
      </div>

      {/* Sizes */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Sizes</h3>
        <div className="flex gap-3 items-center flex-wrap">
          <Badge size="sm">Small</Badge>
          <Badge size="md">Medium</Badge>
        </div>
      </div>

      {/* Priority Badges */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Goal Priorities</h3>
        <div className="flex gap-3 flex-wrap">
          <Badge variant="error">Essential</Badge>
          <Badge variant="warning">Important</Badge>
          <Badge variant="primary">Aspirational</Badge>
        </div>
      </div>

      {/* Status Badges */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Goal Status</h3>
        <div className="flex gap-3 flex-wrap">
          <Badge variant="success">On Track</Badge>
          <Badge variant="warning">Behind</Badge>
          <Badge variant="error">At Risk</Badge>
          <Badge variant="neutral">Achieved</Badge>
        </div>
      </div>
    </div>
  );
}

/**
 * Example: ProgressBar Component Usage
 */
export function ProgressBarExamples() {
  return (
    <div className="space-y-6 p-6 max-w-2xl">
      <h2 className="text-2xl font-bold">ProgressBar Examples</h2>

      {/* Basic Progress */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Progress</h3>
        <ProgressBar value={75} />
      </div>

      {/* With Percentage */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">With Percentage</h3>
        <ProgressBar value={82} showPercentage />
      </div>

      {/* With Label */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">With Label</h3>
        <ProgressBar value={65} label="Retirement Goal" showPercentage />
      </div>

      {/* Colors */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Colors</h3>
        <ProgressBar value={90} color="success" label="On Track" showPercentage />
        <ProgressBar value={60} color="warning" label="Behind Schedule" showPercentage />
        <ProgressBar value={30} color="error" label="At Risk" showPercentage />
        <ProgressBar value={50} color="primary" label="Primary" showPercentage />
        <ProgressBar value={40} color="neutral" label="Neutral" showPercentage />
      </div>

      {/* Heights */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Heights</h3>
        <ProgressBar value={70} height="sm" label="Small" showPercentage />
        <ProgressBar value={70} height="md" label="Medium" showPercentage />
        <ProgressBar value={70} height="lg" label="Large" showPercentage />
      </div>

      {/* Multiple Progress Bars (Goal Dashboard) */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Goal Progress Example</h3>
        <Card>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-sm font-medium text-gray-700">Retirement 2045</span>
                  <span className="text-sm text-gray-600">$1.2M / $1.5M</span>
                </div>
                <ProgressBar value={80} color="success" showPercentage />
              </div>

              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-sm font-medium text-gray-700">College Fund 2030</span>
                  <span className="text-sm text-gray-600">$180K / $240K</span>
                </div>
                <ProgressBar value={75} color="warning" showPercentage />
              </div>

              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-sm font-medium text-gray-700">Home Down Payment 2026</span>
                  <span className="text-sm text-gray-600">$95K / $100K</span>
                </div>
                <ProgressBar value={95} color="success" showPercentage />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Example: Complete Goal Card using all components
 */
export function CompleteGoalCardExample() {
  return (
    <div className="p-6 max-w-md">
      <h2 className="text-2xl font-bold mb-6">Complete Goal Card Example</h2>

      <Card hoverable>
        <CardHeader
          title="Retirement 2045"
          subtitle="Retire comfortably at age 65 with $80,000 per year income"
          badge={<Badge variant="error" size="sm">Essential</Badge>}
          action={
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          }
        />

        <CardContent>
          <div className="space-y-4">
            {/* Amount Display */}
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-900 font-mono">$1,200,000</span>
              <span className="text-sm text-gray-500">/ $1,500,000</span>
            </div>

            {/* Progress Bar */}
            <ProgressBar value={80} color="success" showPercentage />

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <span className="text-xs text-gray-500 block mb-1">Target Date</span>
                <p className="font-medium text-gray-900">Jun 1, 2045</p>
                <p className="text-xs text-gray-500">(20y 6m)</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 block mb-1">Monthly Required</span>
                <p className="font-medium text-gray-900 font-mono">$1,850</p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <Badge variant="success" size="md">On Track</Badge>
              <div className="text-sm text-right">
                <span className="text-gray-500">Success: </span>
                <span className="font-semibold text-gray-900">87%</span>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button variant="secondary" size="sm" fullWidth>
            View Details
          </Button>
          <Button variant="ghost" size="sm">
            Edit
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
