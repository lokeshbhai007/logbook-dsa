// src/app/api/questions/route.js
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db('logbook-dsa');
    const collection = db.collection('questions');

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
    const totalCount = await collection.countDocuments(query);
    
    // Get paginated questions
    const questions = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
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
    const { questionNumber, title, status = 'need_check' } = await request.json();

    const client = await clientPromise;
    const db = client.db('leetcode-logbook');
    const collection = db.collection('questions');

    // Check if question already exists
    const existingQuestion = await collection.findOne({ questionNumber: parseInt(questionNumber) });
    if (existingQuestion) {
      return NextResponse.json({ error: 'Question already exists' }, { status: 409 });
    }

    const question = {
      questionNumber: parseInt(questionNumber),
      title,
      status,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(question);
        
    return NextResponse.json({ ...question, _id: result.insertedId });
  } catch (error) {
    console.error('Error adding question:', error);
    return NextResponse.json({ error: 'Failed to add question' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { id, status } = await request.json();

    const client = await clientPromise;
    const db = client.db('leetcode-logbook');
    const collection = db.collection('questions');

    const { ObjectId } = require('mongodb');
        
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: status,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}