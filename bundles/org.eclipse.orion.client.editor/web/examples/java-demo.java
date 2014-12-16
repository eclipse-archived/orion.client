/**
 * General Description
 */
public class Test extends TestClass {

	public static final String CONSTANT_STRING = "const";

	private List<Integer> values;
	private int count;

	public static void main (String args[]) {
		// TODO: Put this somewhere else
		try {
			Test test = new Test(5); 
		} catch (RuntimeException e) {
			
		}

	}

	public Test(int count) {
		// The count needs to be positive
		if(count < 0) 
			throw new RuntimeException("Bad Value");
		this.count = count;
		values = new LinkedList<Integer>();
		computeValues();
	}

	public void computeValues() {
		for(int i = 0; i < count; i++) {
			values.add(i);
		}
		super.addValues(values, count);
	}

	/**
	 * Returns the current list
	 */
	public List<int> getList() {
		return values;
	}
} 