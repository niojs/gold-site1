import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Хранилище в памяти (пока нет YDB)
let deposits = [
  { id: '1', name: 'Прииск Золотой', location: 'Урал', grade: 3.5, status: 'active', user_id: '1' },
  { id: '2', name: 'Шахта Северная', location: 'Сибирь', grade: 4.2, status: 'exploration', user_id: '1' },
];

// ========== ПОЛУЧИТЬ ВСЕ ЗАПИСИ ==========
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;

    if (!sessionId) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    return NextResponse.json(deposits);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// ========== ДОБАВИТЬ ЗАПИСЬ ==========
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;

    if (!sessionId) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { name, location, grade, status } = await request.json();

    if (!name || !location) {
      return NextResponse.json({ error: 'Название и место обязательны' }, { status: 400 });
    }

    const newDeposit = {
      id: Date.now().toString(),
      name,
      location,
      grade: parseFloat(grade) || 0,
      status: status || 'active',
      user_id: sessionId,
    };

    deposits.push(newDeposit);
    return NextResponse.json({ success: true, deposit: newDeposit });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ error: 'Ошибка добавления' }, { status: 500 });
  }
}

// ========== РЕДАКТИРОВАТЬ ЗАПИСЬ ==========
export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;

    if (!sessionId) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { id, name, location, grade, status } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID обязателен' }, { status: 400 });
    }

    const index = deposits.findIndex(d => d.id === id);
    
    if (index === -1) {
      return NextResponse.json({ error: 'Запись не найдена' }, { status: 404 });
    }

    deposits[index] = {
      ...deposits[index],
      name: name || deposits[index].name,
      location: location || deposits[index].location,
      grade: grade !== undefined ? parseFloat(grade) : deposits[index].grade,
      status: status || deposits[index].status,
    };

    return NextResponse.json({ success: true, deposit: deposits[index] });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ error: 'Ошибка обновления' }, { status: 500 });
  }
}

// ========== УДАЛИТЬ ЗАПИСЬ ==========
export async function DELETE(request) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;

    if (!sessionId) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID обязателен' }, { status: 400 });
    }

    const initialLength = deposits.length;
    deposits = deposits.filter(d => d.id !== id);

    if (deposits.length === initialLength) {
      return NextResponse.json({ error: 'Запись не найдена' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ error: 'Ошибка удаления' }, { status: 500 });
  }
}