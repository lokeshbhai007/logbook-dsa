// src/app/api/questions/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

// Define Question Schema
const questionSchema = new mongoose.Schema({
  questionNumber: {
    type: Number,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['need_check', 'completed', 'in_progress', 'skipped'],
    default: 'need_check'
  }
}, {
  timestamps: true // This adds createdAt and updatedAt automatically
});

// Create or get existing model
const Question = mongoose.models.Question || mongoose.model('Question', questionSchema);

export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;

    let query = {};
        
    if (status) {
      query.status = status;
    }
        
    if (search) {
      query.$or = [
        { questionNumber: parseInt(search) || 0 },
        { title: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count for pagination info
    const totalCount = await Question.countDocuments(query);
    
    // Get paginated questions
    const questions = await Question
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() for better performance when you don't need Mongoose document features
    
    const hasMore = skip + questions.length < totalCount;
    const nextPage = hasMore ? page + 1 : null;
        
    return NextResponse.json({
      questions,
      pagination: {
        currentPage: page,
        totalCount,
        hasMore,
        nextPage,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    
    const { questionNumber, title, status = 'need_check' } = await request.json();

    // Check if question already exists
    const existingQuestion = await Question.findOne({ questionNumber: parseInt(questionNumber) });
    if (existingQuestion) {
      return NextResponse.json({ error: 'Question already exists' }, { status: 409 });
    }

    const question = new Question({
      questionNumber: parseInt(questionNumber),
      title,
      status
    });

    const savedQuestion = await question.save();
        
    return NextResponse.json(savedQuestion);
  } catch (error) {
    console.error('Error adding question:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json({ error: 'Validation failed', details: validationErrors }, { status: 400 });
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Question number already exists' }, { status: 409 });
    }
    
    return NextResponse.json({ error: 'Failed to add question' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await dbConnect();
    
    const { id, status } = await request.json();

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid question ID' }, { status: 400 });
    }
        
    const updatedQuestion = await Question.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true } // new: true returns the updated document, runValidators ensures validation
    );

    if (!updatedQuestion) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, question: updatedQuestion });
  } catch (error) {
    console.error('Error updating question:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json({ error: 'Validation failed', details: validationErrors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}