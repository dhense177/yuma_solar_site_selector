import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Example API route showing how to use Supabase in API routes
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Example: Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 401 })
    }

    // Example: Query a table (uncomment and modify based on your schema)
    // const { data, error } = await supabase
    //   .from('your_table')
    //   .select('*')
    //   .limit(10)

    // if (error) {
    //   return NextResponse.json({ error: error.message }, { status: 500 })
    // }

    return NextResponse.json({
      user: user ? { id: user.id, email: user.email } : null,
      message: 'API route working with Supabase!',
      // data: data,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
